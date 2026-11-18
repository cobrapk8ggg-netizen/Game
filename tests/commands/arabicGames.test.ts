import dadJoke from "@commands/fun/subcommands/dadJoke.command";
import eightBall from "@commands/games/subcommands/eightBall.command";
import wouldYouRather from "@commands/games/subcommands/wouldYouRather.command";
import { setBotCopyLanguage } from "@config/strings";
import { createMockClient, createMockInteraction } from "@tests/helpers/mocks";

beforeEach(() => setBotCopyLanguage("ar"));
afterEach(() => setBotCopyLanguage(undefined));

it("serves an Iraqi joke locally when the bot language is Arabic", async () => {
	const interaction = createMockInteraction();
	await dadJoke.run?.(interaction, createMockClient());
	expect(interaction.deferReply).not.toHaveBeenCalled();
	expect(JSON.stringify(interaction.sent)).toContain("نكتة عراقية");
});

it("keeps a player's question and selects an Arabic answer", async () => {
	const question = "Will it rain?";
	const interaction = createMockInteraction({ options: { question } });
	await eightBall.run?.(interaction, createMockClient());
	const reply = JSON.stringify(interaction.sent);
	expect(reply).toContain(question);
	expect(reply).toContain("الجواب");
	expect(reply).not.toContain("Magic eight ball");
});

it("uses the Arabic set of dilemmas", async () => {
	const interaction = createMockInteraction();
	await wouldYouRather.run?.(interaction, createMockClient());
	const reply = JSON.stringify(interaction.sent);
	expect(reply).toContain("ماذا تختار؟");
	expect(reply).not.toContain("Would you rather");
});
