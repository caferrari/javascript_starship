'use strict';

var ships = [];

(function() {

    Component.addType(new ComponentType('Generator', 0));
    Component.addType(new ComponentType('Weapon', 10));
    Component.addType(new ComponentType('Shield', 5));

    var ship = new Ship('Piece of crap');
    ship.setReactor(new Reactor(10));

    ship.addComponent(new Weapon("Cannon", 2, 20, 100));
    ship.addComponent(new Weapon("Cannon", 2, 20, 100));
    ship.addComponent(new Weapon("IonCannon", 12, 30, 2500));
    ship.addComponent(new Weapon("LaserCannon", 40, 70, 2000));

    ships.push(ship);
})();
