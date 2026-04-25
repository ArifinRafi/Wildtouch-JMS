export interface MagnetProduct {
  name: string;
  image: string | null;
}

export type MagnetRow = [MagnetProduct | null, MagnetProduct | null, MagnetProduct | null];

export interface MagnetSegment {
  id: string;
  title: string;
  shortTitle: string;
  color: string;
  bgTint: string;
  rows: MagnetRow[];
}

const p = (name: string, file: string): MagnetProduct => ({
  name,
  image: `/planogram/magnets/${file}`,
});
// product exists but has no extractable image
const n = (name: string): MagnetProduct => ({ name, image: null });
const empty: null = null;

export const MAGNET_SEGMENTS: MagnetSegment[] = [
  {
    id: "zoo-mammals",
    title: "Zoo Animals & Mammals",
    shortTitle: "Zoo & Mammals",
    color: "from-violet-500 to-purple-600",
    bgTint: "bg-violet-500/5",
    rows: [
      [p("Grey Elephant",        "Grey_Elephant.jpg"),       p("Monkey Gold",         "Monkey_Gold.png"),         p("Orange Feet Penguin",   "Orange_Feet_Penguin.jpg")],
      [p("Pink Elephant",        "Pink_Elephant.png"),       p("Monkey Silver",       "Monkey_Silver.png"),       p("Black Feet Penguin",    "Black_Feet_Penguin.jpg")],
      [p("Purple Elephant",      "Purple_Elephant.jpg"),     n("Lemur"),                                          p("Macaroon Penguin",      "Macaroon_Penguin.jpg")],
      [p("Blue Elephant",        "Blue_Elephant.png"),       p("Silver Tiger",        "Silver_Tiger.jpg"),        p("Humboldt Penguin",      "Humboldt_Penguin.png")],
      [p("Elephant Head",        "Elephant_Head.png"),       p("Gold Tiger",          "Gold_Tiger.png"),          p("King Penguin",          "King_Penguin.png")],
      [p("Giraffe",              "Giraffe.jpg"),             p("Zebra",               "Zebra.png"),               p("Baby Penguin",          "Baby_Penguin.jpg")],
      [p("Giraffe Mom & Baby",   "Giraffe_Mom_Baby.jpg"),    p("Zebra Face",          "Zebra_Face.png"),          p("Koala",                 "Koala.jpg")],
      [p("Pink Giraffe",         "Pink_Giraffe.png"),        p("Lion Head Brown",     "Lion_Head_Brown.jpg"),     p("Koala Green Branch",    "Koala_Green_Branch.png")],
      [p("Purple Giraffe",       "Purple_Giraffe.png"),      p("Lion Head Gold",      "Lion_Head_Gold.png"),      p("Rhino",                 "Rhino.jpg")],
      [p("Blue Giraffe",         "Blue_Giraffe.png"),        p("Lion Walking",        "Lion_Walking.jpg"),        p("Kangaroo",              "Kangaroo.png")],
      [p("Orangutan",            "Orangutan.jpg"),           p("Meerkat",             "Meerkat.jpg"),             p("Camel",                 "Camel.png")],
      [p("Squirrel Monkey",      "Squirrel_Monkey.png"),     p("Wolf Grey",           "Wolf_Grey.jpg"),           p("Raccoon",               "Raccoon.png")],
      [p("Gold Monkey Face",     "Gold_Monkey_Face.jpg"),    p("White Wolf",          "White_Wolf.png"),          p("Badger",                "Badger.png")],
      [p("Chimpanzee",           "Chimpanzee.png"),          p("Leopard",             "Leopard.jpg"),             p("Deer",                  "Deer.png")],
      [p("Monkey Face",          "Monkey_Face.png"),         p("Snow Leopard",        "Snow_Leopard.jpg"),        p("Stag",                  "Stag.png")],
      [p("Gorilla",              "Gorilla.png"),             p("Cheetah",             "Cheetah.png"),             p("Otter",                 "Otter.jpg")],
      [p("Barbary Monkey",       "Barbary_Monkey.jpg"),      p("Jaguar",              "Jaguar.png"),              p("Snake - Clear",         "Snake_Clear.png")],
      [p("Gibbon",               "Gibbon.jpg"),              p("Sloth",               "Sloth.png"),               p("Green Snake",           "Green_Snake.jpg")],
    ],
  },
  {
    id: "wildlife-birds",
    title: "Wildlife, Birds & Insects",
    shortTitle: "Wildlife & Birds",
    color: "from-emerald-500 to-teal-600",
    bgTint: "bg-emerald-500/5",
    rows: [
      [p("Polar Bear",           "Polar_Bear.png"),          p("Hedgehog",            "Hedgehog.png"),            p("Peacock",               "Peacock.png")],
      [p("Polar Bear Mum & Baby","Polar_Bear_Mum_Baby.png"), p("Honey Badger",        "Honey_Badger.png"),        p("Puffin",                "Puffin.png")],
      [p("Polar Bear Face",      "Polar_Bear_Face.png"),     p("Capybara",            "Capybara.png"),            p("Bee",                   "Bee.jpg")],
      [p("Red Panda",            "Red_Panda.png"),           p("Flamingo Large",      "Flamingo_Large.jpg"),      p("Eagle",                 "Eagle.png")],
      [p("Red Panda Branch",     "Red_Panda_Branch.jpg"),    p("Flamingo Fuchsia",    "Flamingo_Fuchsia.jpg"),    p("Blue Tit",              "Blue_Tit.png")],
      [p("Red Panda Face",       "Red_Panda_Face.jpg"),      p("Flamingo Small",      "Flamingo_Small.jpg"),      p("Robin",                 "Robin.png")],
      [p("Panda",                "Panda.jpg"),               p("Red Parrot",          "Red_Parrot.jpg"),          p("Gold Bird",             "Gold_Bird.png")],
      [p("Bat",                  "Bat.jpg"),                 p("Blue Parrot",         "Blue_Parrot.png"),         p("Purple Dragonfly",      "Purple_Dragonfly.jpg")],
      [p("Crocodile",            "Crocodile.png"),           p("Lorikeet",            "Lorikeet.jpg"),            p("Blue Dragonfly",        "Blue_Dragonfly.png")],
      [p("Tortoise",             "Tortoise.png"),            p("Toucan",              "Toucan.jpg"),              p("Peacock Butterfly",     "Peacock_Butterfly.png")],
      [p("Iguana",               "Iguana.png"),              p("Toucan Silver",       "Toucan_Silver.png"),       p("Butterfly Pink",        "Butterfly_Pink.jpg")],
      [p("Green Frog",           "Green_Frog.jpg"),          p("Barn Owl",            "Barn_Owl.jpg"),            p("Pink & Blue Butterfly", "Pink_Blue_Butterfly.jpg")],
      [p("Red/Blue Frog",        "Red_Blue_Frog.png"),       p("Snowy Owl",           "Snowy_Owl.png"),           p("Blue Butterfly",        "Blue_Butterfly.jpg")],
      [p("Blue Frog",            "Red_Blue_Frog_2.png"),     p("Green Owl",           "Green_Owl.jpg"),           p("Orange Butterfly",      "Orange_Butterfly.jpg")],
      [p("Yellow Frog",          "Yellow_Frog.png"),         p("Blue Owl",            "Blue_Owl.jpg"),            p("Caterpillar",           "Caterpillar.png")],
      [p("Fox",                  "Fox.png"),                 p("Swan",                "Swan.jpg"),                p("Worm",                  "Worm.png")],
      [p("Red Squirrel",         "Red_Squirrel.png"),        p("Swan Black",          "Swan_Black.png"),          p("Snail",                 "Snail.png")],
    ],
  },
  {
    id: "plants-sea-farm",
    title: "Plants, Sea & Farm Animals",
    shortTitle: "Plants, Sea & Farm",
    color: "from-lime-500 to-green-600",
    bgTint: "bg-lime-500/5",
    rows: [
      [p("Ladybird",             "Ladybird.png"),            p("Pink Octopus",        "Pink_Octopus.png"),        p("Purple Dolphin",        "Purple_Dolphin.png")],
      [p("Rose",                 "Rose.png"),                p("Red Octopus",         "Red_Octopus.png"),         p("Blue Dolphin",          "Blue_Dolphin.png")],
      [p("Daffodil",             "Daffodil.png"),            p("Blue Octopus",        "Blue_Octopus.png"),        p("Pink Dolphin",          "Pink_Dolphin.png")],
      [p("Daisy",                "Daisy.png"),               p("Blue Jellyfish",      "Blue_Jellyfish.jpg"),      p("Clear Whale Tail",      "Clear_Whale_Tail.jpg")],
      [n("Gerbera Orange"),                                   p("Pink Jellyfish",      "Pink_Jellyfish.png"),      p("Blue Whale Tail",       "Blue_Whale_Tail.png")],
      [p("Gerbera Pink",         "Gerbera_Pink.png"),        p("Orange Clownfish",    "Orange_Clownfish.jpg"),    p("Pink Mermaid",          "Pink_Mermaid.jpg")],
      [p("Snowdrop",             "Snowdrop.png"),            p("Black & White Clownfish","Black_White_Clownfish.jpg"),p("Blue Mermaid",        "Blue_Mermaid.png")],
      [p("Sunflower",            "Sunflower.png"),           p("AB Starfish",         "AB_Starfish.jpg"),         p("Crab",                  "Crab.png")],
      [n("Fuchsia"),                                          p("Pink Starfish",       "Pink_Starfish.png"),       p("Lobster",               "Lobster.png")],
      [p("Duck",                 "Duck.png"),                p("Blue Starfish",       "Blue_Starfish.png"),       p("Highland Cow",          "Highland_Cow.png")],
      [p("Duckling",             "Duckling.png"),            p("Orange Starfish",     "Orange_Starfish.png"),     p("Sheep",                 "Sheep.png")],
      [p("Fairy Moon",           "Fairy_Moon.jpg"),          p("Blue Tang",           "Blue_Tang.jpg"),           p("Goat Brown",            "Goat_Brown.png")],
      [p("Fairy Pink",           "Fairy_Pink.jpg"),          p("Piranha",             "Piranha.jpg"),             p("Donkey Body",           "Donkey_Body.png")],
      [p("Fairy Green",          "Fairy_Green.jpg"),         p("Seal",                "Seal.jpg"),                p("Horse",                 "Horse.png")],
      [p("Anglefish",            "Anglefish.png"),           p("Clamshell",           "Clamshell.png"),           p("Horse Shoe",            "Horse_Shoe.png")],
      [p("Pufferfish",           "Pufferfish.jpg"),          p("Skull",               "Skull.png"),               p("Rabbit",                "Rabbit.png")],
      [p("Blob Fish",            "Blob_Fish.png"),           p("Anchor",              "Anchor.png"),              p("Silver Heart",          "Silver_Heart.png")],
    ],
  },
  {
    id: "vehicles-fantasy-london",
    title: "Vehicles, Fantasy, Dinosaurs & Flags",
    shortTitle: "Vehicles & Dinos",
    color: "from-amber-500 to-orange-600",
    bgTint: "bg-amber-500/5",
    rows: [
      [p("Teddy",                "Teddy.png"),               p("Mammoth",             "Mammoth.png"),             p("Scotland Flag",         "Scotland_Flag.png")],
      [p("Hot Air Balloon",      "Hot_Air_Balloon.png"),     p("Plesiosaurus",        "Plesiosaurus.png"),        p("Yellow Scottish Flag",  "Yellow_Scottish_Flag.png")],
      [p("Rainbow",              "Rainbow.png"),             p("Turquoise Plesiosaurus","Turquoise_Plesiosaurus.png"),p("Union Jack",          "Union_Jack.png")],
      [p("Green Tractor",        "Green_Tractor.png"),       p("Triceratops",         "Triceratops.jpg"),         p("London Bus",            "London_Bus.jpg")],
      [p("Red Tractor",          "Red_Tractor.png"),         p("Red Triceratops",     "Red_Triceratops.jpg"),     p("Telephone Box",         "Telephone_Box.jpg")],
      [p("Digger",               "Digger.png"),              p("Diplodocus",          "Diplodocus.jpg"),          p("Tea Cups",              "Tea_Cups.jpg")],
      [p("Unicorn Head",         "Unicorn_Head.jpg"),        p("Pink Diplodocus",     "Pink_Diplodocus.png"),     p("Corgi",                 "Corgi.jpg")],
      [p("Unicorn Body",         "Unicorn_Body.jpg"),        p("Spinosaurus",         "Spinosaurus.jpg"),         p("London Bridge",         "London_Bridge.png")],
      [p("Lochness",             "Lochness.jpg"),            p("Yellow Spinosaurus",  "Yellow_Spinosaurus.png"),  p("Taxi",                  "Taxi.png")],
      [p("Nessie in Water",      "Nessie_in_Water.jpg"),     p("Blue Pterodactyl",    "Blue_Pterodactyl.png"),    p("Gold Crown",            "Gold_Crown.png")],
      [p("Nessie with Hat",      "Nessie_with_Hat.jpg"),     p("Yellow Pterodactyl",  "Yellow_Pterodactyl.jpg"),  p("Silver Crown",          "Silver_Crown.png")],
      [p("Nessie with Flag",     "Nessie_with_Flag.jpg"),    p("T.Rex",               "T_Rex.png"),               p("London Banner",         "London_Banner.png")],
      [p("Scotty Dog",           "Scotty_Dog.jpg"),          p("Enamel T.Rex",        "Enamel_T_Rex.png"),        p("Guard",                 "Guard.jpg")],
      [p("Red Dragon",           "Red_Dragon.jpg"),          p("Stegosaurus",         "Stegosaurus.png"),         p("London Eye AB",         "London_Eye_AB.png")],
      [p("Chinese Dragon",       "Chinese_Dragon.png"),      p("Blue Stegosaurus",    "Blue_Stegosaurus.png"),    p("London Eye Blue",       "London_Eye_Blue.jpg")],
      [p("Silver Heart",         "Silver_Heart_Magnet.png"), p("Black Country Flag",  "Black_Country_Flag.png"),  p("Beefeater",             "Beefeater.png")],
      [p("Gold Star",            "Gold_Star.png"),           p("Welsh Flag",          "Welsh_Flag.png"),          p("Big Ben",               "Big_Ben.png")],
    ],
  },
  {
    id: "london-christmas",
    title: "London Landmarks & Christmas",
    shortTitle: "London & Xmas",
    color: "from-red-500 to-rose-600",
    bgTint: "bg-red-500/5",
    rows: [
      [p("Tower of London",      "Tower_of_London.png"),     p("Snowman",             "Snowman.png"),             p("Rabbit",                "Rabbit_2.png")],
      [p("Buckingham Palace",    "Buckingham_Palace.png"),   p("Silver Santa",        "Silver_Santa.png"),        p("Tigger",                "Tigger.png")],
      [p("10 Downing Street",    "10_Downing_Street.png"),   p("Gold Santa",          "Gold_Santa.png"),          p("Owl",                   "Owl.png")],
      [p("London Word",          "London_Word.jpg"),         p("Candy Cane",          "Candy_Cane.png"),          p("Winnie the Pooh Face",  "Winnie_the_Pooh_Face.png")],
      [p("Post Box",             "Post_Box.png"),            p("Gingerbreadman",      "Gingerbreadman.png"),      p("Eeyore Face",           "Eeyore_Face.png")],
      [p("Revolver",             "Revolver.jpg"),            p("Gold Gingerbreadman", "Gold_Gingerbreadman.jpg"), p("Piglet Face",           "Piglet_Face.png")],
      [p("Bichon Frise",         "Bichon_Frise.png"),        p("Reindeer",            "Reindeer.png"),            p("Tigger Face",           "Tigger_Face.png")],
      [p("Green Train",          "Green_Train.png"),         p("Snowflake",           "Snowflake.png"),           empty],
      [p("Red Train",            "Red_Train.png"),           p("Bauble",              "Bauble.png"),              empty],
      [p("Miner",                "Minor.png"),               p("Christmas Present",   "Christmas_Present.png"),   empty],
      [p("Steam Engine",         "Steam_Engine.png"),        p("Polar Bear",          "Polar_Bear_Christmas.png"),empty],
      [p("Cheese",               "Cheese.png"),              p("Penguin",             "Penguin_Christmas.png"),   empty],
      [p("Christmas Tree",       "Christmas_Tree.png"),      p("Winnie the Pooh",     "Winnie_the_Pooh.png"),     empty],
      [p("Santa Hat",            "Santa_Hat.png"),           p("Piglet Face",         "Piglet_Face_2.png"),       empty],
      [p("Santa Boot",           "Santa_Boot.png"),          p("Eeyore",              "Eeyore.png"),              empty],
      [p("Christmas Bells",      "Christmas_Bells.png"),     p("Roo",                 "Roo.png"),                 empty],
      [p("Santa Sleigh",         "Santa_Sleigh.png"),        p("Kanga",               "Kanga.png"),               empty],
    ],
  },
];
