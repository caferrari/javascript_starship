'use strict';

$(document).ready(function() {

    var ids = 0;

    var getTemplate = function(id) {
        return $('#' + id).clone().attr('id', ++ids);
    }

    var setupComponent = function(component, parent) {

        var tpl = getTemplate('templateComponent');
        tpl.find('.propComponentName').html(component.name);

        var setupGenerator = function() {
            var pb = getTemplate('templateText');
            pb.find('span').html("Power: " + component.power);
            tpl.find('.propComponent').append(pb);
        }

        var setupWeapon = function() {
            var pb = getTemplate('templateProgressBar');
            pb.find('.progress-bar').addClass('progress-bar-success');
            pb.find('span').html('Capacitor Level');

            var cdpb = getTemplate('templateProgressBar');
            cdpb.find('.progress-bar').addClass('progress-bar-danger');
            cdpb.find('span').html('Cooldown');

            var toolbar = getTemplate('templateToolbar');

            var textShots = getTemplate('templateText');
            textShots.find('span').html("Shots fired: 0");

            tpl.find('.propComponent').append(textShots, pb, cdpb, toolbar);
            var btnFire = getTemplate('templateButton').html('Fire');

            btnFire.on('click', function() {
                try {
                    component.fire();
                } catch (e) {
                    // Silent!
                }

            });

            toolbar.append(btnFire);

            component.on('WEAPON_CHARGING', function(w) {
                var capacitor = w.getCapacitor();
                var ratio = capacitor.energy * 100 / capacitor.capacity;
                var bar = pb.find('.progress-bar').css({
                    transition: 'none',
                    width: ratio + '%'
                });

                if (capacitor.energy >= w.powerUsage) {
                    bar.removeClass('progress-bar-danger');
                    bar.addClass('progress-bar-success');
                } else {
                    bar.removeClass('progress-bar-success');
                    bar.addClass('progress-bar-danger');
                }
            });

            component.on('WEAPON_FIRED', function(w) {
                textShots.find('span').html("Shots fired: " + w.shots);
                cdpb.find('.progress-bar').css({width: '100%', transition: 'none'}).animate({width: 0}, component.cooldown);
            });



            // component.on('WEAPON_READY', function(w) {
            //     btnFire.removeAttr('disabled');
            // });

            // component.on('WEAPON_NOT_READY', function(w) {
            //     btnFire.attr('disabled', 'disabled');
            // });
        }

        if (component.type.name == 'Generator') {
            setupGenerator();
        }

        if (component.type.name == 'Weapon') {
            setupWeapon();
        }

        parent.find('.propShip').append(tpl);
    }

    var createShip = function(ship) {

        var tpl = getTemplate('templateShip');

        tpl.find('.propShipName').html(ship.name);

        ship.getComponents().forEach(function(component) {
            setupComponent(component, tpl);
        });

        var toolbar = getTemplate('templateToolbar');

        tpl.find('.propShip').append(toolbar);

        var btnFire = getTemplate('templateButton').html('Fire');

        toolbar.append(btnFire);

        btnFire.on('mousedown', function() {
            ship.triggerDown();
        });

        btnFire.on('mouseup', function() {
            ship.triggerUp();
        });

        $('#ships').append(tpl);

    }


    ships.forEach(function(ship) {

        createShip(ship);

        ship.powerOn();

    });

});
