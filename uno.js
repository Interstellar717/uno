var wrong = new Audio('https://www.myinstants.com/media/sounds/neg-wrongbuzzer.mp3');
wrong.load();
var turn = 1;

class Player {
    constructor(data) {
        this.deck = data.deck,
            this.name = data.name,
            this.opp = data.opponent,
            this.last_play = null,
            //    remember to input hand_cards value
            this.hand = new Hand(data.hand_cards, this.deck, this)
    }
    AI() {
        if (localStorage.getItem('winner') != 'false') return false

        console.log("\n~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~\n ")
        for (let i of [1, 2, 3, 4]) {
            var compatible_hand = false;
            this.hand.cards.forEach(e => {
                this.deck.disc.verify(e) && (compatible_hand = true)
            })
            if (compatible_hand) break;
            compatible_hand && i > 1 && (console.log("AI " + this.name + " plays card: ", this.hand.cards[0].color, this.hand.cards[0].number), this.deck.disc.discard(this, this.hand.cards[0]))
            !compatible_hand && i < 4 && (this.deck.draw(this.hand), console.log("AI " + this.name + " draws card: ", this.hand.cards[0].color, this.hand.cards[0].number))
            if (i >= 4 && !compatible_hand) { rotate_game(); console.log("AI " + this.name + " passes. *rotates game*"); return; }
            update()
        }
        var compatible_cards = [],
            priority_list = { "discard all": 5, "skip": 4, "reverse": 4, "x2": 3, "wild": 2, "wild x4": 1 },
            priority = { priority: Infinity, card: null };



        this.hand.cards.forEach(e => {
            this.deck.disc.verify(e) && compatible_cards.push(e);
            e.color == this.deck.disc.cards[0].color && (priority_list["wild"] = 5, priority_list["wild x4"] = 3)
        })
        compatible_cards.forEach(e => {
            priority_list[e.number] < priority.priority && (priority = { priority: priority_list[e.number], card: e })
        })

        console.log("Compatible Card List:\n--------------------")
        compatible_cards.forEach(e => console.log(" => ", e.color, e.number))
        console.log("--------------------")
        console.log("Priority:", priority.card ? priority?.card?.color + " " + priority?.card?.number : "None")
        //no card of greater priority is selected, choose a random compatible card and play it
        if (priority.priority == Infinity) {
            let random_card = compatible_cards[Math.floor(Math.random() * compatible_cards.length)];
            console.log("AI " + this.name + " plays card: ", random_card.color, random_card.number)
            this.deck.disc.discard(this, random_card, true, true)
        } else {
            console.log("AI " + this.name + " plays card: ", priority.card.color, priority.card.number)
            this.deck.disc.discard(this, priority.card, true, true)
        }


        setTimeout(rotate_game, 500)
        console.log('AI ' + this.name + ' turn ends *rotates game*');
        ["x2", "skip", "reverse"].includes(deck.disc.cards[0].number) && setTimeout(() => this.AI(), 2000)

        //IMPORTANT
        if (this.name == "Player 2") (turn++, document.querySelector('#turn-number').textContent = "Turn "+turn)
        update()
    }
    action(card, AI = false) {
        switch (card.number) {
            case "x2": {
                this.deck.draw(this.opp.hand)
                this.deck.draw(this.opp.hand)
                rotate_game()
            } break;
            case "skip": {
                rotate_game()
            } break;
            case "reverse": {
                rotate_game()
            } break;
            case "wild": {
                !AI ? card.wild() : card.wild(this.color_calc().max)
            } break;
            case "wild x4": {
                !AI ? card.wild() : card.wild(this.color_calc().max)
                for (let i in [1, 1, 1, 1]) this.deck.draw(this.opp.hand)
            } break;
            case "discard all": {
                var color = card.color,
                    tempHand = this.hand.cards.slice(); //to return a copy
                tempHand.reverse();
                var is_more_cards = false;
                tempHand.forEach(e => {
                    if (e.color === color) {
                        this.deck.disc.discard(this, e, false)
                        is_more_cards = true
                    }
                })
                is_more_cards && this.action(this.deck.disc.cards[0])
            } break;

        }
    }
    color_calc() {
        var color_count = { "red": 0, "blue": 0, "green": 0, "yellow": 0 };

        this.hand.cards.forEach(e => {
            switch (e.color) {
                case "red": color_count.red++; break;
                case "blue": color_count.blue++; break;
                case "green": color_count.green++; break;
                case "yellow": color_count.yellow++; break;
            }
        })
        var color_max = [
            ["red", color_count.red],
            ["blue", color_count.blue],
            ["green", color_count.green],
            ["yellow", color_count.yellow]
        ].sort((a, b) => b[1] - a[1])
        return { max: color_max[0][0], all: color_max }
    }
}
class CardGroup {
    constructor(cards_initial) {
        this.cards_initial = cards_initial
        this.cards = []
    }
    fill(card_demographic = {}) {
        for (let value of card_demographic) {
            for (let i = 0; i < value.count; i++) {
                var card_data = {},
                    card_attr = ["color", "number", "class"]
                for (let j in card_attr) {
                    card_data[card_attr[j]] = value[card_attr[j]]
                }
                this.cards.push(new Card(card_data))
            }
        }
    }
    add(card) {
        this.cards.splice(0, 0, card)
    }
    shuffle() {
        let currentIndex = this.cards.length;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {

            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [this.cards[currentIndex], this.cards[randomIndex]] = [
                this.cards[randomIndex], this.cards[currentIndex]];
        }
    }
    toHTML(reverse = false) {
        let cards = "",
            arr;
        !reverse && (arr = this.cards)
        //temp var to prevent reversing the actual array
        if (reverse) {
            var temp = this.cards.slice()
            arr = temp.reverse()
        }

        for (let card of arr) {
            cards += card.toHTML()
        }
        return cards
    }
}
class Deck extends CardGroup {
    constructor(cards_initial) {
        super(cards_initial)
        var card_demographic = [],
            colors = ["red", "blue", "green", "yellow"];
        for (let color of colors) {
            for (let number = 0; number < 10; number++) {
                card_demographic.push({ color: color, number: number, count: number ? 2 : 1 })
            }
            card_demographic.push({ color: color, number: "skip", count: 2, class: "msr" })
            card_demographic.push({ color: color, number: "reverse", count: 2, class: "msr" })
            card_demographic.push({ color: color, number: "x2", count: 2 })
            card_demographic.push({ color: color, number: "discard all", count: 2, class: "msr" })
        }

        card_demographic.push({ color: "", number: "wild", count: 4, class: "msr" })
        card_demographic.push({ color: "", number: "wild x4", count: 4 })

        this.fill(card_demographic),
            this.shuffle(),
            this.disc = new Discard(Infinity)
    }

    draw(target = this.disc) {
        var card = this.cards.shift();
        target.add(card);
        target == this.disc && (card.number == 'wild' || card.number == 'wild x4') && (target.cards[0].wild(["red", "blue", "green", "yellow"][Math.floor(Math.random() * 4)]));
        return `Card drawn: ${card.toString()}`
    }
}
class Discard extends CardGroup {
    constructor(cards_initial) {
        super(cards_initial)
    }
    discard(player, card, action = true, AI = false) {
        if (this.verify(card)) {
            player.hand.cards.splice(player.hand.cards.indexOf(card), 1)

            this.cards.splice(0, 0, card)

            action && player.action(card, AI)

            player.last_play = card.toString()

            return true
        }
        else {

            player.name != "AI" && wrong.play();

            return false
        }
    }
    verify(card) {
        if (card.color == this.cards[0].color || card.number == this.cards[0].number || !card.color)
            return true
        else {

            return false
        }
    }
}
class Hand extends CardGroup {
    constructor(cards_initial, deck, player) {
        super(cards_initial),
            this.player = player
        for (let i = 0; i < cards_initial; i++) {
            deck.cards[0] && deck.draw(this)
        }
    }
}
class Card {
    constructor(data) {
        this.color = data.color,
            this.number = data.number,
            this.class = data.class || ""
    }
    toString() {
        return this.color + " " + this.number
    }
    toHTML() {
        var HTML = null,
            number = this.number;
        switch (this.number) {
            case "wild x4": HTML = `<div class="${this.class || 'card wild'}"><span class="num-small top">x4</span><span class="num-large" style="font-family:Material Symbols Rounded">cards</span><span class="num-small bottom">x4</span></div>`
                break;
            case "wild": number = "cards"
                break;
            case "skip": number = "do_not_disturb"
                break;
            case "reverse": number = "cycle"
                break;
            case "discard all": number = "filter_none"
                break;
        }
        return HTML || `<div class="card ${this.color} ${this.class}"><span class="num-small top">${number}</span><span class="num-large">${number}</span><span class="num-small bottom">${number}</span></div>`
    }
    wild(color) {
        if (!color) {
            while (!color) {
                var color = prompt("What will the new color be?");
            }
        }
        color = color.split(' ').join('');
        if (["red", "blue", "green", "yellow"].includes(color.toLowerCase())) {
            this.color = color
            this.class = "card wild " + color
            this.number == "wild" && (this.class += " msr")
        }
        else {
            alert(`"${color}" is not a valid color.`)
            this.wild()
        }
    }
}
function setFirst() {
    document.getElementsByClassName('first')[0]?.classList.remove('first')
    document.getElementsByClassName('first')[0]?.classList.remove('first')
    document.getElementsByClassName('player-1 card-hand')[0]?.getElementsByClassName('card')[0]?.classList.add('first');
    document.getElementsByClassName('player-2 card-hand')[0]?.getElementsByClassName('card')[0]?.classList.add('first');
}
const
    deck = new Deck(108),
    player1 = new Player({ deck: deck, name: "Player 1", hand_cards: 7, opponent: null }),
    player2 = new Player({ deck: deck, name: "Player 2", hand_cards: 7, opponent: player1 });
player1.opp = player2;
const update = () => {
    document.getElementsByClassName('player-1 card-hand')[0].innerHTML = player1.hand.toHTML()
    document.getElementsByClassName('player-2 card-hand')[0].innerHTML = player2.hand.toHTML()
    document.getElementById('discard').innerHTML = deck.disc.toHTML(true)
    document.getElementById('deck').innerHTML = deck.toHTML(true)
    document.getElementsByClassName('player-1 name-tag')[0].textContent = player1.name
    document.getElementsByClassName('player-2 name-tag')[0].textContent = player2.name
    setFirst()
}
deck.draw(deck.disc, false)
update()