import { randomInt } from "node:crypto";
import { botCopy, usesArabicCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { embed, reply } from "@lib/discord";
import { truncate } from "@lib/format";

const ANSWERS = [
	"It is certain.",
	"Without a doubt.",
	"You may rely on it.",
	"Most likely.",
	"Signs point to yes.",
	"Ask again later.",
	"Better not tell you now.",
	"Cannot predict now.",
	"Do not count on it.",
	"My reply is no.",
	"Very doubtful.",
	"Absolutely not.",
];

const IRAQI_ANSWERS = [
	"إي، هاي محسومة. 🎱",
	"إي أكيد، لا تدوّخ راسك.",
	"توكل، أمورها طيبة.",
	"الغالب إي، بس خلّينا نشوف.",
	"الظاهر إي. حتى الكرّة متفائلة!",
	"اسألني بعدين، هسّه الكرّة تشرب چاي. ☕",
	"خلّيها مفاجأة أحسن. 🤫",
	"هسّه ما أبين شي. أرجعلي بعد شويّة.",
	"لا تعوّل عليها هواي.",
	"الجواب لا. حتى الكرّة هزّت راسها.",
	"ما أظن، بس العلم عند الله.",
	"لا هاي، حتى لو ترجّ الكرّة مرّة ثانية. 😄",
];

export default defineCommand({
	name: "8ball",
	description: "Asks the magic eight ball.",
	category: "games",
	options: [{ name: "question", description: "What you want to know.", type: "string", required: true }],

	async run(interaction) {
		const answers = usesArabicCopy() ? IRAQI_ANSWERS : ANSWERS;
		await reply(interaction, {
			embeds: [
				embed({
					category: "games",
					title: botCopy("\u{1f3b1} Magic eight ball", "🎱 الكرّة السحرية"),
					fields: [
						{
							name: botCopy("Question", "السؤال"),
							value: truncate(interaction.options.getString("question", true), 500),
						},
						{ name: botCopy("Answer", "الجواب"), value: answers[randomInt(answers.length)]! },
					],
				}),
			],
		});
	},
});
