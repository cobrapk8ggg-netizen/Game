import { randomInt } from "node:crypto";
import { z } from "zod";
import { usesArabicCopy } from "@config/strings";
import { botName } from "@core/brand";
import { defineCommand } from "@core/command";
import { embed, reply } from "@lib/discord";
import { fetchJson } from "@lib/infra";

const jokeSchema = z.object({ id: z.string(), joke: z.string() });

const IRAQI_JOKES = [
	"سألوا واحد بخيل: شنو أكثر شي يضايقك بالسفر؟ گال: من يگولون لي «اصرف النظر». حتى هاي بيها صرف!",
	"واحد اشترى ساعة ضد الماي. من عطش، الساعة گالت له: آني ضد الماي، مو ضد العطش.",
	"واحد سأل خبّاز: عندك خبز أمس؟ گال له: إي. گال: زين، باچر أجي آخذ خبز اليوم.",
	"واحد راح للمكتبة وسأل: عندكم كتاب عن الصبر؟ گالوا له: إي، بس انتظر. گال: لا، خلّوه إلكم.",
	"واحد سألوه: ليش تحط المنبّه بعيد عنك؟ گال: حتى إذا ما گمت، على الأقل أعرف وين أروح.",
];

export default defineCommand({
	name: "dad-joke",
	description: "Fetches a random dad joke.",
	category: "fun",
	cooldown: 5_000,

	async run(interaction) {
		if (usesArabicCopy()) {
			const joke = IRAQI_JOKES[randomInt(IRAQI_JOKES.length)]!;
			await reply(interaction, {
				embeds: [embed({ category: "fun", title: "نكتة عراقية", description: `> ${joke}` })],
			});
			return;
		}
		await interaction.deferReply();

		const joke = await fetchJson("icanhazdadjoke", "https://icanhazdadjoke.com/", jokeSchema, {
			headers: { Accept: "application/json", "User-Agent": `${botName()} Discord bot` },
		});

		await reply(interaction, {
			embeds: [
				embed({
					category: "fun",
					title: "Dad joke",
					description: `> ${joke.joke}`,
					footer: `Joke ID: ${joke.id}`,
				}),
			],
		});
	},
});
