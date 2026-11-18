import { randomInt } from "node:crypto";
import { z } from "zod";
import { botCopy } from "@config/strings";
import { defineCommand, inTextChannel } from "@core/command";
import { embed, reply } from "@lib/discord";
import { titleCase } from "@lib/format";
import { fetchJson } from "@lib/infra";

const speciesSchema = z.object({
	name: z.string(),
	sprites: z.object({
		other: z.object({ "official-artwork": z.object({ front_default: z.string().nullable() }) }).optional(),
		front_default: z.string().nullable(),
	}),
});

/** The National Dex count at the time of writing; a miss simply rerolls. */
const MAX_DEX = 1_025;

export default defineCommand({
	name: "guess-the-pokemon",
	description: "Guess the Pokémon from its artwork.",
	category: "games",
	guildOnly: true,
	cooldown: 15_000,

	async run(interaction) {
		const channel = inTextChannel(interaction);
		await interaction.deferReply();

		const species = await fetchJson(
			"pokeapi",
			`https://pokeapi.co/api/v2/pokemon/${randomInt(1, MAX_DEX + 1)}`,
			speciesSchema,
		);

		const artwork = species.sprites.other?.["official-artwork"].front_default ?? species.sprites.front_default;

		await reply(interaction, {
			embeds: [
				embed({
					category: "games",
					title: botCopy("Who's that Pokémon?", "ما اسم هذا البوكيمون؟"),
					description: botCopy("You have 30 seconds to guess.", "أمامك ثلاثون ثانية لتخمّن الاسم كما يظهر في اللعبة."),
					...(artwork !== null ? { image: artwork } : {}),
				}),
			],
		});

		const collected = await channel
			.awaitMessages({
				filter: (message) => message.content.trim().toLowerCase() === species.name.toLowerCase(),
				max: 1,
				time: 30_000,
			})
			.catch(() => null);

		const winner = collected?.first();

		await interaction.followUp({
			embeds: [
				embed({
					category: "games",
					title: winner ? botCopy("Correct", "إجابة صحيحة") : botCopy("Time is up", "انتهى الوقت"),
					description: winner
						? botCopy(
								`${winner.author} guessed it \u2014 it was **${titleCase(species.name)}**.`,
								`أجاب ${winner.author} إجابة صحيحة. اسم البوكيمون **${titleCase(species.name)}**.`,
							)
						: botCopy(
								`Nobody guessed it. It was **${titleCase(species.name)}**.`,
								`لم يخمّنه أحد. اسم البوكيمون **${titleCase(species.name)}**.`,
							),
				}),
			],
		});
	},
});
