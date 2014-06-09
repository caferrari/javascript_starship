'use strict';

var EventManager = (function() {

    var obj = function() {
        var listeners = [];

        this.attach = function (event, listener, target, callback) {

            if (!listeners[event]) {
                listeners[event] = [];
            }

            listeners[event].push({
                'event': event,
                'listener': listener,
                'target': target,
                'callback': callback
            });
        }

        this.trigger = function(event, notifier) {

            if (!listeners[event]) {
                return;
            }
            
            setTimeout(function() {
                listeners[event].forEach(function(e) {
                    if (e.target == notifier) {
                        return e.callback.call(e.listener, notifier);
                    }
                    if (!e.target) {
                        return e.callback.call(e.listener, notifier);   
                    }
                }); 
            }, 0);
            
        }

        this.getListeners = function() {
            return listeners;
        }
    }

    return obj;

})();

var Splitter = (function() {

    var obj = function() {
        this.consumers = [];
        this.priorities = [];
        this.max = 0;
        this.length = 0;
    }

    obj.prototype.append = function(priority, object) {

        if (0 == priority) {
            return;
        }
        
        this.max += priority;
        this.consumers.push(object);
        this.priorities.push(priority);
        this.length++;
    }

    obj.prototype.indexOf = function(item) {
        return this.consumers.indexOf(item);
    }

    obj.prototype.remove = function(item) {
        var index = this.indexOf(item);
        
        this.max -= this.priorities.splice(index, 1)[0];
        this.consumers.splice(index, 1);

        this.length--;
        return item;
    }

    obj.prototype.split = function(energy) {

        var that = this;

        this.consumers.forEach(function(consumer, index) {

            var slice = that.priorities[index] * energy / that.max;
            consumer.getCapacitor().recharge(slice);
        });

    }

    return obj;

})();

var Capacitor = (function() {

    var obj = function(consumer, capacity) {
        this.capacity = capacity;
        this.energy = 0;
        this.consumer = consumer;
    }

    obj.prototype.discharge = function() {
        this.energy = 0;
    }

    obj.prototype.recharge = function (amount) {

        if (this.energy >= this.capacity) {
            throw "the capacitor is full";
        }

        this.energy += amount;
        this.getEventManager().trigger('CAPACITOR_CHARGING', this.consumer);

        if (this.energy >= this.capacity) {
            this.energy = this.capacity;
            this.getEventManager().trigger('CAPACITOR_FULL', this.consumer);
        }
    }

    obj.prototype.hasEnoughPower = function(powerNedded) {
        return this.energy > powerNedded;
    }

    obj.prototype.isFull = function() {
        return this.power === this.capacity;
    }

    obj.prototype.consume = function(power) {
        if (!this.hasEnoughPower(power)) {
            throw "not enough power";
        }

        this.getEventManager().trigger('CAPACITOR_CONSUMED', this.consumer);

        this.energy -= power;
        return true;
    }

    obj.prototype.getEventManager = function() {
        return this.eventManager;
    }

    obj.prototype.setEventManager = function(em) {
        this.eventManager = em;
    }

    return obj;

})();

var Component = (function() {

    var types = [];

    var obj = function(name, type) {
        this.name = name;
        this.type = Component.getType(type);
        this.eventManager = null;

        this.currentPower = 0;
        this.maxPower = 0;
    }

    obj.addType = function(type) {
        types[type.name] = type;
    }
    
    obj.getType = function(name) {
        return types[name];
    }

    obj.prototype.getType = function() {
        return this.type;
    }

    obj.prototype.setEventManager = function(em) {
        this.eventManager = em;
        if (this.capacitor) {
            this.capacitor.setEventManager(em);
        }
    }

    obj.prototype.getEventManager = function() {
        return this.eventManager;
    }

    obj.prototype.trigger = function(event) {
        if ('undefined' == typeof(this.eventManager)) {
            return;
        }

        this.eventManager.trigger(event, this);
    }

    obj.prototype.getCapacitor = function () {
        if (!this.capacitor) {
            throw "component without capacitor";
        }
        return this.capacitor;
    }

    obj.prototype.setCapacitor = function (capacitor) {
        this.capacitor = capacitor;
    }

    obj.prototype.setReactor = function(reactor) {
        if (this.reactor) {
            this.reactor.detach(this);
        }

        this.reactor = reactor;
        this.reactor.attach(this);
    }

    obj.prototype.on = function(event, callback) {
        this.getEventManager().attach(event, this, this, callback);
    }

    obj.prototype.initialize = function () {

    }

    return obj;

})();

var ComponentType = (function(name, priority) {

    var obj = function(name, powerPriority) {
        this.name = name;
        this.powerPriority = powerPriority;
    }

    return obj;

})();

var Reactor = (function() {

    var obj = function(power) {
        Component.apply(this, ['Reactor', 'Generator']);

        this.power = power;
        this.consumers = [];
        this.chargingConsumers = [];
        this.chargedConsumers = [];

        this.online = false;
    }

    obj.prototype = new Component();
    obj.prototype.constructor = obj;

    obj.prototype.attach = function(consumer, priority) {
        this.consumers.push(consumer);
    }

    obj.prototype.detach = function(consumer) {

        if (typeof(consumer.recharge) !== 'function') {
            throw "Invalid power consumer";
        }

        this.removeFromList(this.consumers, consumer);
        this.removeFromList(this.chargingConsumers, consumer);
        this.removeFromList(this.chargedConsumers, consumer);
    }

    obj.prototype.setReactor = function(reactor) {
        throw "i'm the power core";
    }

    obj.prototype.initialize = function() {
        this.getEventManager().attach('POWER_GENERATED', this, false, function(c) {
            var consumerIndex = this.consumers.indexOf(c);
            this.chargedConsumers.push(this.consumers.splice(consumerIndex, 1));
        });

        this.getEventManager().attach('CAPACITOR_FULL', this, false, function(c) {
            var consumerIndex = this.consumers.indexOf(c);
            this.chargedConsumers.push(this.consumers.splice(consumerIndex, 1)[0]);

            var item = this.chargingConsumers.remove(c);
        });

        this.getEventManager().attach('CAPACITOR_CONSUMED', this, false, function(c) {
            var consumerIndex = this.chargedConsumers.indexOf(c);
            if (-1 === consumerIndex) {
                return;
            }

            this.consumers.push(this.chargedConsumers.splice(consumerIndex, 1)[0]);
            this.chargingConsumers.append(c.getType().powerPriority, c);
        });
    }

    obj.prototype.powerOn = function() {
        var interval = 1000 / this.power;
        var that = this;

        this.buildPowerQueue();

        this.online = setInterval(function() {
            that.chargingConsumers.split(1);
        }, interval);;
    }

    obj.prototype.buildPowerQueue = function() {
        var that = this;

        this.chargingConsumers = new Splitter();

        this.consumers.forEach(function(component) {
            that.chargingConsumers.append(component.getType().powerPriority ,component);
        });
    }

    obj.prototype.powerOff = function() {
        clearInterval(this.on);
        this.on = false;
        this.chargingConsumers = new Splitter();;
        this.chargedConsumers = [];
    }

    return obj;
})();

var Weapon = (function() {

    var obj = function(name, powerUsage, maxPower, cooldown) {
        Component.apply(this, [name, 'Weapon']);
        this.powerUsage = powerUsage;
        this.setCapacitor(new Capacitor(this, maxPower));
        this.cooldown = cooldown || 1000;
        this.inCooldown = false;
        this.ready = false;
        this.shots = 0;
    }

    obj.prototype = new Component();
    obj.prototype.constructor = obj;

    obj.prototype.isReady = function() {
        if (this.isInCooldown() || !this.hasEnoughPower()) {
            if (this.ready) {
                this.getEventManager().trigger('WEAPON_NOT_READY', this);
            }
            return this.ready = false;
        }

        if (!this.ready) {
            this.getEventManager().trigger('WEAPON_READY', this);
        }
        return this.ready = true;
         
    }

    obj.prototype.fire = function() {

        if (this.isInCooldown()) {
            this.getEventManager().trigger('WEAPON_IN_COOLDOWN', this);
            throw "weapon in cooldown";
        }

        if (!this.hasEnoughPower()) {
            this.getEventManager().trigger('WEAPON_NEED_POWER', this);
            throw "not enough power";
        }
    
        var that = this;
        this.capacitor.consume(this.powerUsage);
        this.inCooldown = true;
        setTimeout(function() {
            that.inCooldown = false;
            that.isReady();
        }, this.cooldown);

        this.shots++;
        this.getEventManager().trigger('WEAPON_FIRED', this);
        this.isReady();

        return true;
    }

    obj.prototype.isInCooldown = function () {
        return this.inCooldown;
    }

    obj.prototype.hasEnoughPower = function() {
        return this.getCapacitor().hasEnoughPower(this.powerUsage);
    }

    obj.prototype.initialize = function() {
        var that = this;
        this.getEventManager().attach('CAPACITOR_CHARGING', this, this, function(obj) {
            this.getEventManager().trigger('WEAPON_CHARGING', this);
            that.isReady();
        });
        this.getEventManager().trigger('WEAPON_NOT_READY', this);
    }

    return obj;

})();

var Ship = (function() {

    var obj = function(name) {
        this.name = name;
        this.eventManager = new EventManager;
        this.components = [];
        this.weapons = [];
        this.trigger = false;
    }

    obj.prototype.setReactor = function(reactor) {
        reactor.setEventManager(this.eventManager);
        reactor.initialize();
        this.reactor = reactor;
        this.components.push(reactor);
    }

    obj.prototype.addComponent = function(component) {
        component.setEventManager(this.eventManager);
        component.setReactor(this.reactor);
        component.initialize();
        this.components.push(component);

        if (component.getType().name == 'Weapon') {
            this.weapons.push(component);
        }
    }

    obj.prototype.getComponents = function() {
        return this.components;
    }

    obj.prototype.initialize = function() {
        var that = this;
        this.components.forEach(function(component) {
            component.setReactor(that.reactor);
        });

        this.reactor.initialize(); 
    }

    obj.prototype.triggerDown = function() {
        if (this.trigger) {
            return;
        }

        var that = this;
        this.trigger = setInterval(function() {
            that.weapons.forEach(function(w) {
                try {
                    w.fire();   
                } catch (e) {
                    // Silent!
                }
            });
        }, 10);
    }

    obj.prototype.triggerUp = function () {
        clearInterval(this.trigger);
        this.trigger = false;
    }

    obj.prototype.powerOn = function() {
        this.reactor.powerOn();
    }

    return obj;
})();