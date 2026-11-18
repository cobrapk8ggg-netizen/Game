import { randomInt } from "node:crypto";
import { botCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { embed, reply } from "@lib/discord";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function fakeCode(length = 16): string {
	let code = "";
	for (let index = 0; index < length; index += 1) code += ALPHABET[randomInt(ALPHABET.length)];
	return code;
}

export default defineCommand({
	name: "nitro",
	description: "Generates a fake Nitro gift link.",
	category: "fun",
	cooldown: 10_000,

	async run(interaction) {
		const code = fakeCode();
		await reply(interaction, {
			embeds: [
				embed({
					category: "fun",
					title: botCopy("A wild gift appeared", "ظهرت هدية مفاجئة"),
					description: `\`\`\`\nhttps://discord.gift/${code}\n\`\`\`\n${botCopy(
						"It is not a real gift — nobody is getting Nitro today.",
						"هاي للمزح! خلي تمنّيات الـ Nitro لباچر. 😄",
					)}`,
				}),
			],
		});
	},
});
