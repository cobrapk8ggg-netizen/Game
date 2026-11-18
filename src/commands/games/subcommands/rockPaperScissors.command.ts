import { randomInt } from "node:crypto";
import { botCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { embed, reply } from "@lib/discord";

const MOVES = ["rock", "paper", "scissors"] as const;
type Move = (typeof MOVES)[number];

const EMOJI: Record<Move, string> = { rock: "\u{1faa8}", paper: "\u{1f4c4}", scissors: "\u2702\ufe0f" };
const ARABIC_MOVES: Record<Move, string> = { rock: "حجر", paper: "ورقة", scissors: "مقص" };
const BEATS: Record<Move, Move> = { rock: "scissors", paper: "rock", scissors: "paper" };

export default defineCommand({
	name: "rps",
	description: "Plays rock, paper, scissors.",
	category: "games",
	options: [
		{
			name: "move",
			description: "Your move.",
			type: "string",
			required: true,
			choices: MOVES.map((move) => ({ name: move, value: move })),
		},
	],

	async run(interaction) {
		const yours = interaction.options.getString("move", true) as Move;
		const mine = MOVES[randomInt(MOVES.length)]!;

		const result =
			yours === mine
				? botCopy("It is a draw.", "تعادلنا! لا آني ربحت ولا إنت. 😄")
				: BEATS[yours] === mine
					? botCopy("You win.", "عاشت إيدك، فزت! 🎉")
					: botCopy("I win.", "هاي المرّة آني فزت. بعدك تريد جولة؟ 😄");

		await reply(interaction, {
			embeds: [
				embed({
					category: "games",
					title: botCopy("Rock, paper, scissors", "حجر، ورقة، مقص"),
					description: botCopy(
						`You chose ${EMOJI[yours]} **${yours}**.\nI chose ${EMOJI[mine]} **${mine}**.\n\n**${result}**`,
						`اختيارك: ${EMOJI[yours]} **${ARABIC_MOVES[yours]}**.\nاختياري: ${EMOJI[mine]} **${ARABIC_MOVES[mine]}**.\n\n**${result}**`,
					),
				}),
			],
		});
	},
});
