'use strict';

var ships = [];

(function() {

    Component.addType(new ComponentType('Generator', 0));
    Component.addType(new ComponentType('Weapon', 10));
    Component.addType(new ComponentType('Shield', 5));

    var ship = new Ship('Bla bla');
    ship.setReactor(new Reactor(10));

    ship.addComponent(new Weapon("Cannon", 2, 10, 100));
    ship.addComponent(new Weapon("IonCannon", 12, 20, 2000));
    ship.addComponent(new Weapon("LaserCannon", 40, 100, 3000));

    ships.push(ship);
})();
