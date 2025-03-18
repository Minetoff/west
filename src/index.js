import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    getDescriptions() {
        const baseDescriptions = super.getDescriptions(); // получаем описание от Card
        return [getCreatureDescription(this), ...baseDescriptions];
    }
}

class Duck extends Creature {
    constructor(name, power, image) {
        super(name || "Мирная утка", power || 2, image);
    }

    quacks() {
        console.log('quack')
    };

    swims() {
        console.log('float: both;')
    };
}

class Dog extends Creature {
    constructor(name, power, image) {
        super(name || "Пес-бандит", power || 3, image);
    }
}

class Gatling extends Card {
    constructor() {
        super("Гатлинг", 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        for (let card of oppositePlayer.table) {
            taskQueue.push(onDone => {
                this.dealDamageToCreature(2, card, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);
    }
}

class Trasher extends Dog {
    constructor(name, power, image) {
        super(name || "Громила", power || 5, image);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const newDamage = Math.max(value - 1, 0);
        this.view.signalAbility(() => {
            continuation(newDamage);
        });
    }

    getDescriptions() {
        return ["Громила: получает на 1 меньше урона", ...super.getDescriptions()];
    }
}

class Lad extends Dog {
    constructor(name, maxPower, image) {
        super(name || "Браток", maxPower || 2, image);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        return this.getInGameCount() * (this.getInGameCount() + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        super.doAfterComingIntoPlay(gameContext, () => {
            Lad.setInGameCount(Lad.getInGameCount() + 1);
            continuation();
        })
    }

    doBeforeRemoving(continuation) {
        super.doBeforeRemoving(() => {
            Lad.setInGameCount(Lad.getInGameCount() - 1);
            continuation();
        });
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(Math.max(value - Lad.getBonus(), 0));
    }

    getDescriptions() {
        const baseDescriptions = super.getDescriptions();

        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')) {
            return ["Чем их больше, тем они сильнее", ...baseDescriptions];
        }
        return baseDescriptions;
    }
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
