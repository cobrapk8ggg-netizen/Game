import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { botCopy, usesArabicCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { dataPath } from "@core/paths";
import { embed, reply } from "@lib/discord";

const questions = new Map<string, string[]>();

function pool(): string[] {
	const filename = usesArabicCopy() ? "wouldYouRather.ar.json" : "wouldYouRather.json";
	const cached = questions.get(filename);
	if (cached !== undefined) return cached;

	const loaded = z
		.array(z.string())
		.nonempty()
		.parse(JSON.parse(readFileSync(dataPath(filename), "utf8")));
	questions.set(filename, loaded);
	return loaded;
}

export default defineCommand({
	name: "would-you-rather",
	description: "Poses a would-you-rather question.",
	category: "games",
	cooldown: 3_000,

	async run(interaction) {
		const available = pool();
		const question = available[randomInt(available.length)] ?? botCopy("Would you rather?", "ماذا تختار؟");

		await reply(interaction, {
			embeds: [
				embed({ category: "games", title: botCopy("Would you rather", "ماذا تختار؟"), description: `> ${question}` }),
			],
		});
	},
});
