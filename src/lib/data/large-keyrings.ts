export interface KeyringProduct {
  name: string;
  image: string | null;
}

// Null = empty cell in the Excel sheet
export type KeyringRow = [KeyringProduct | null, KeyringProduct | null, KeyringProduct | null];

const p = (name: string, file: string): KeyringProduct => ({
  name,
  image: `/planogram/large-keyrings/${file}`,
});
const empty: null = null;

// ─── Products in exact Excel row order (col B → col E → col H per row) ────────
// Each sub-array is one Excel row: [left, middle, right]
export const KEYRING_ROWS: KeyringRow[] = [
  // ── Zoo Animals ──────────────────────────────────────────────────────────────
  [p("Elephant Grey",         "Elephant_Grey.png"),        p("Blue Giraffe",       "Blue_Giraffe.jpeg"),        p("Leopard",               "Leopard.png")],
  [p("Elephant Grey Ear",     "Elephant_Grey_Ear.png"),    p("Purple Giraffe",     "Purple_Giraffe.jpeg"),      p("Snow Leopard",          "Snow_Leopard.jpeg")],
  [p("Elephant Clear",        "Elephant_Clear.png"),       p("Pink Giraffe",       "Pink_Giraffe.jpeg"),        p("Wolf",                  "Wolf.jpeg")],
  [p("Elephant Pink",         "Elephant_Pink.jpeg"),       p("Sloth",              "Sloth.png"),                p("White Wolf",            "White_Wolf.png")],
  [p("Elephant Blue",         "Elephant_Blue.jpeg"),       p("Zebra",              "Zebra.jpeg"),               p("Red Panda Branch",      "Red_Panda_Branch.png")],
  [p("Purple Elephant",       "Purple_Elephant.jpeg"),     p("Tortoise",           "Tortoise.jpeg"),            { name: "Red Panda Walking", image: null }],
  [p("Elephant Head",         "Elephant_Head.png"),        p("Orangutan",          "Orangutan.jpeg"),           p("Red Panda Face",        "Red_Panda_Face.png")],
  [p("Tiger",                 "Tiger.jpeg"),               p("Monkey",             "Monkey.jpeg"),              p("Panda",                 "Panda.jpeg")],
  [p("Silver Tiger",          "Silver_Tiger.jpeg"),        p("Monkey Black",       "Monkey_Black.png"),         p("Kangaroo",              "Kangaroo.jpeg")],
  [p("Lion Head Gold",        "Lion_Head_Gold.jpeg"),      p("Gibbon",             "Gibbon.png"),               p("Polar Bear Face",       "Polar_Bear_Face.png")],
  [p("Lion Head Brown",       "Lion_Head_Brown.jpeg"),     p("Lemur",              "Lemur.png"),                p("Polar Bear Mum & Baby", "Polar_Bear_Mum_Baby.png")],
  [p("Lion Walking",          "Lion_Walking.jpeg"),        p("Meerkat",            "Meerkat.jpeg"),             p("Bat",                   "Bat.png")],
  [p("Giraffe",               "Giraffe.png"),              p("Jaguar",             "Jaguar.png"),               p("Koala",                 "Koala.png")],
  [p("Giraffe Mum & Baby",    "Giraffe_Mum_Baby.png"),     p("Cheetah",            "Cheetah.jpeg"),             p("Koala Mum & Baby",      "Koala_Mum_Baby.png")],

  // ── British Wildlife, Reptiles & Birds ───────────────────────────────────────
  [p("Stag",                  "Stag.jpeg"),                p("Hedgehog",           "Hedgehog.png"),             p("Diamond Flamingo",      "Diamond_Flamingo.png")],
  [p("Otter",                 "Otter.jpeg"),               p("Red Squirrel",       "Red_Squirrel.png"),         p("Red Parrot",            "Red_Parrot.png")],
  [p("Clear Snake",           "Clear_Snake.png"),          p("Fox",                "Fox.png"),                  p("Blue Parrot",           "Blue_Parrot.png")],
  [p("Green Snake",           "Green_Snake.jpeg"),         p("Capybara",           "Capybara.jpeg"),            p("Toucan",                "Toucan.png")],
  [p("Crocodile",             "Crocodile.jpeg"),           p("Penguin Jewel",      "Penguin_Jewel.jpeg"),       p("Lorikeet",              "Lorikeet.jpeg")],
  [p("Iguana",                "Iguana.jpeg"),              p("Penguin Jewel Pink", "Penguin_Jewel_Pink.jpeg"),  p("Barn Owl",              "Barn_Owl.jpeg")],
  [p("Green Frog",            "Green_Frog.jpeg"),          p("Penguin Jewel Blue", "Penguin_Jewel_Blue.jpeg"),  p("Blue Owl",              "Blue_Owl.jpeg")],
  [p("Blue/Red Frog",         "Blue_Red_Frog.png"),        p("Penguin Clear",      "Penguin_Clear.jpeg"),       p("Swan",                  "Swan.jpeg")],
  [p("Blue Frog",             "Blue_Frog.jpeg"),           p("Penguin Orange Feet","Penguin_Orange_Feet.png"),  p("Black Swan",            "Black_Swan.jpeg")],
  [p("Yellow Frog",           "Yellow_Frog.jpeg"),         p("Penguin Black Feet", "Penguin_Black_Feet.png"),   p("Kingfisher",            "Kingfisher.png")],
  [p("Wallaby",               "Wallaby.jpeg"),             p("Baby Penguin",       "Baby_Penguin.png"),         p("Puffin",                "Puffin.jpeg")],
  [p("Badger",                "Badger.png"),               p("Humboldt Penguin",   "Humboldt_Penguin.png"),     p("Eagle",                 "Eagle.png")],
  [p("Deer",                  "Deer.png"),                 p("King Penguin",       "King_Penguin.png"),         p("Snowy Owl",             "Snowy_Owl.png")],
  [p("Rhino",                 "Rhino.png"),                p("Flamingo",           "Flamingo.png"),             p("Peacock",               "Peacock.png")],

  // ── Insects, Plants & Sea ────────────────────────────────────────────────────
  [p("Blue Tit",              "Blue_Tit.png"),             p("Daffodil",           "Daffodil.png"),             p("Duckling",              "Duckling.png")],
  [p("Robin",                 "Robin.png"),                p("Daisy",              "Daisy.png"),                p("Duck",                  "Duck.png")],
  [p("Bee",                   "Bee.jpeg"),                 p("Gerbera Pink",       "Gerbera_Pink.jpeg"),        p("Bichon Frise",          "Bichon_Frise.jpeg")],
  [p("Purple Dragonfly",      "Purple_Dragonfly.jpeg"),    p("Gerbera Orange",     "Gerbera_Orange.png"),       p("AB Seahorse",           "AB_Seahorse.png")],
  [p("Blue Dragonfly",        "Blue_Dragonfly.png"),       p("Sunflower",          "Sunflower.png"),            p("Col Seahorse",          "Col_Seahorse.png")],
  [p("Blue Butterfly",        "Blue_Butterfly.jpeg"),      p("Fuchsia",            "Fuchsia.png"),              p("AB Seahorse (2)",       "AB_Seahorse_2.png")],
  [p("Pink Butterfly",        "Pink_Butterfly.jpeg"),      p("Snowdrop",           "Snowdrop.png"),             p("Axolotl",               "Axolotl.png")],
  [p("Orange Butterfly",      "Orange_Butterfly.png"),     p("Fairy Pink",         "Fairy_Pink.png"),           p("Pink Octopus",          "Pink_Octopus.png")],
  [p("Peacock Butterfly",     "Peacock_Butterfly.jpeg"),   p("Fairy Green",        "Fairy_Green.png"),          p("Blue Octopus",          "Blue_Octopus.png")],
  [p("Caterpillar",           "Caterpillar.png"),          p("Rainbow",            "Rainbow.jpeg"),             p("Red Octopus",           "Red_Octopus.png")],
  [p("Snail",                 "Snail.png"),                p("Green Frog",         "Green_Frog_2.jpeg"),        p("AB Turtle",             "AB_Turtle.png")],
  [p("Worm",                  "Worm.png"),                 p("Red/Blue Frog",      "Red_Blue_Frog.png"),        p("Turtle",                "Turtle.png")],
  [p("Ladybird",              "Ladybird.png"),             p("Blue Frog",          "Blue_Frog_2.jpeg"),         p("Swimming Turtle",       "Swimming_Turtle.png")],
  [empty,                                                  p("Rabbit",             "Rabbit.jpeg"),              p("Puffer Fish",           "Puffer_Fish.png")],

  // ── Marine & Farm Animals ────────────────────────────────────────────────────
  [p("Stingray",              "Stingray.jpeg"),            p("Blue Jellyfish",     "Blue_Jellyfish.png"),       p("Skull",                 "Skull.png")],
  [p("Grey Stingray",         "Grey_Stingray.jpeg"),       p("Pink Starfish",      "Pink_Starfish.jpeg"),       p("Lobster",               "Lobster.png")],
  [p("Brown Stingray",        "Brown_Stingray.png"),       { name: "Blue Tang",      image: null },             p("Crab",                  "Crab.png")],
  [p("Seal",                  "Seal.jpeg"),                p("Piranha",            "Piranha.png"),              p("Clear Crab",            "Clear_Crab.png")],
  [p("Blue Shark",            "Blue_Shark.png"),           p("Clamshell",          "Clamshell.png"),            p("Pink Mermaid",          "Pink_Mermaid.png")],
  [p("Black Shark",           "Black_Shark.png"),          p("Anchor",             "Anchor.png"),               p("Blue Mermaid",          "Blue_Mermaid.png")],
  [p("Grey Shark",            "Grey_Shark.png"),           p("Enamel Dolphin",     "Enamel_Dolphin.jpeg"),      p("Highland Cow",          "Highland_Cow.png")],
  [p("Shark Head",            "Shark_Head.png"),           p("Glitter Dolphin",    "Glitter_Dolphin.png"),      p("Horse",                 "Horse.png")],
  [p("Pink Starfish",         "Pink_Starfish.png"),        p("Purple Dolphin",     "Purple_Dolphin.png"),       p("Horse Shoe",            "Horse_Shoe.png")],
  [p("Blue Starfish",         "Blue_Starfish.jpeg"),       p("Pink Dolphin",       "Pink_Dolphin.png"),         p("Goat",                  "Goat.png")],
  [p("Orange Starfish",       "Orange_Starfish.png"),      p("Clear Whaletail",    "Clear_Whaletail.jpeg"),     p("Sheep",                 "Sheep.png")],
  [p("New Blue Starfish",     "New_Blue_Starfish.png"),    p("Blue Whale Tail",    "Blue_Whale_Tail.png"),      p("Duck",                  "Duckling_2.png")],
  [p("New Pink Starfish",     "New_Pink_Starfish.png"),    p("Orange Clownfish",   "Orange_Clownfish.png"),     p("Duckling",              "Duck.png")],
  [p("AB Starfish",           "AB_Starfish.png"),          p("Black Clownfish",    "Black_Clownfish.jpeg"),     p("Donkey",                "Donkey.png")],

  // ── Vehicles, Fantasy, Dinosaurs & Flags ─────────────────────────────────────
  [p("Green Tractor",         "Green_Tractor.png"),        p("Miner",              "Miner.png"),                p("Turquoise Plesiosaur",  "Turquoise_Plesiosaur.png")],
  [p("Red Tractor",           "Red_Tractor.png"),          p("Steam Engine",       "Steam_Engine.png"),         p("Plesiosaur",            "Plesiosaur.jpeg")],
  [p("Digger",                "Digger.png"),               p("Hot Air Balloon",    "Hot_Air_Balloon.png"),      p("Pterodactyl",           "Pterodactyl.jpeg")],
  [p("Unicorn Head",          "Unicorn_Head.jpeg"),        p("Ferris Wheel",       "Ferris_Wheel.png"),         p("Blue Pterodactyl",      "Blue_Pterodactyl.png")],
  [p("Unicorn Body",          "Unicorn_Body.png"),         { name: "Gun",            image: null },             p("Spinosaurus",           "Spinosaurus.png")],
  [p("Teddy",                 "Teddy.png"),                p("Diplodocus",         "Diplodocus.jpeg"),          { name: "Yellow Spinosaurus", image: null }],
  [p("Gold Star",             "Gold_Star.png"),            p("Purple Diplodocus",  "Purple_Diplodocus.png"),    p("Black Country Flag",    "Black_Country_Flag.png")],
  [p("Silver Star",           "Silver_Star.png"),          p("T.Rex",              "T_Rex.png"),                p("Union Jack",            "Union_Jack.png")],
  [p("Chinese Dragon",        "Chinese_Dragon.png"),       p("Enamel T.Rex",       "Enamel_T_Rex.png"),         p("Welsh Flag",            "Welsh_Flag.png")],
  [p("Red Dragon",            "Red_Dragon.jpeg"),          p("Mammoth",            "Mammoth.png"),              p("Scottish Flag",         "Scottish_Flag.png")],
  [p("Loch Ness",             "Loch_Ness.png"),            p("Stegosaurus",        "Stegosaurus.jpeg"),         { name: "Scottish Yellow Flag", image: null }],
  [p("Nessie with Hat",       "Nessie_with_Hat.jpeg"),     p("Blue Stegosaurus",   "Blue_Stegosaurus.png"),     p("Green Train",           "Green_Train.jpeg")],
  [p("Nessie with Flag",      "Nessie_with_Flag.png"),     p("Red Triceratops",    "Red_Triceratops.jpeg"),     p("Red Train",             "Red_Train.jpeg")],
  [{ name: "Nessie in Water",  image: null },              p("Orange Triceratops", "Orange_Triceratops.png"),   p("Scotty Dog",            "Scotty_Dog.jpeg")],

  // ── Characters & London Icons ────────────────────────────────────────────────
  [p("Mask",                  "Mask.png"),                 p("Owl",                "Owl.png"),                  p("10 Downing Street",     "10_Downing_Street.png")],
  [p("Spade",                 "Spade.png"),                p("Roo",                "Roo.png"),                  p("Corgi",                 "Corgi.jpeg")],
  [p("Axe",                   "Axe.png"),                  p("Rabbit",             "Rabbit_2.png"),             p("Gold Crown",            "Gold_Crown.png")],
  [p("Hook",                  "Hook.png"),                 p("Kanga",              "Kanga.png"),                p("Silver Crown",          "Silver_Crown.png")],
  [p("Instrument",            "Instrument.png"),           p("Eeyore",             "Eeyore.png"),               p("London Eye Blue",       "London_Eye_Blue.png")],
  [p("Cava Bowl",             "Cava_Bowl.png"),            p("Winnie Face",        "Winnie_Face.png"),          p("London Eye AB",         "London_Eye_AB.png")],
  [p("Frangipani B",          "Frangipani_B.png"),         p("Eeyore Face",        "Eeyore_Face.png"),          p("Shoe",                  "Shoe.png")],
  [p("Frangipani A",          "Frangipani_A.png"),         p("Piglet Face",        "Piglet_Face.png"),          p("Microphone",            "Microphone.png")],
  [p("Frangipani C",          "Frangipani_C.png"),         p("Tigger Face",        "Tigger_Face.png"),          p("Guitar",                "Guitar.png")],
  [p("Rugby Ball",            "Rugby_Ball.png"),           p("Big Ben",            "Big_Ben.png"),              p("London Bridge",         "London_Bridge.png")],
  [p("Fiji Flag",             "Fiji_Flag.jpeg"),           p("Banner",             "Banner.png"),               p("London Bus",            "London_Bus.jpeg")],
  [p("Winnie the Pooh",       "Winnie_the_Pooh.png"),      p("Soldier",            "Soldier.png"),              p("Tea Cups",              "Tea_Cups.png")],
  [p("Piglet",                "Piglet.png"),               p("Telephone Box",      "Telephone_Box.jpeg"),       p("Taxi",                  "Taxi.png")],
  [p("Tigger",                "Tigger.png"),               p("Post Box",           "Post_Box.png"),             p("Tower of London",       "Tower_of_London.png")],

  // ── London Landmarks & Christmas ─────────────────────────────────────────────
  [p("Buckingham Palace",     "Buckingham_Palace.png"),    p("Reindeer",           "Reindeer.png"),             empty],
  [p("Beefeater",             "Beefeater.png"),            p("Snowflake",          "Snowflake.png"),            empty],
  [p("London Word",           "London_Word.png"),          p("Gingerbread Man",    "Gingerbread_Man.png"),      empty],
  [p("Green Fairy",           "Green_Fairy.png"),          p("Gold Gingerbread Man","Gold_Gingerbread_Man.jpeg"),empty],
  [p("Christmas Tree",        "Christmas_Tree.png"),       p("Bauble",             "Bauble.png"),               empty],
  [p("Santa Hat",             "Santa_Hat.png"),            p("Christmas Present",  "Christmas_Present.png"),    empty],
  [p("Santa Boot",            "Santa_Boot.png"),           p("Penguin",            "Penguin_2.png"),            empty],
  [p("Christmas Bells",       "Christmas_Bells.png"),      p("Polar Bear",         "Polar_Bear_2.png"),         empty],
  [p("Santa Sleigh",          "Santa_Sleigh.png"),         p("Tiger",              "Tiger.jpeg"),               empty],
  [p("Snowman",               "Snowman.jpeg"),             p("Cheese",             "Cheese.png"),               empty],
  [p("Silver Santa",          "Silver_Santa.png"),         empty,                                               empty],
  [p("Gold Santa",            "Gold_Santa.png"),           empty,                                               empty],
  [p("Robin",                 "Robin_2.png"),              empty,                                               empty],
  [p("Candy Cane",            "Candy_Cane.png"),           empty,                                               empty],
];

export const TOTAL_PRODUCTS = KEYRING_ROWS.reduce(
  (sum, row) => sum + row.filter(Boolean).length,
  0
);
