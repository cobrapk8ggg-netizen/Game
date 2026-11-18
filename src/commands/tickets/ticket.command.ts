import { ChannelType, PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { channelOption, defineCommand, inGuild, roleOption, textChannelOption } from "@core/command";
import { UserFacingError } from "@core/errors";
import { readerLanguage } from "@core/language";
import { deleteTicketSetup, getTicketSetup, saveTicketSetup } from "@database/repositories/ticketRepository";
import { embed, reply, requirePostable, successEmbed } from "@lib/discord";
import { normaliseTicketSetup, publishTicketPanel } from "@lib/tickets";

export default defineCommand({
	name: "ticket",
	description: "Sets up the ticket panel members use to contact your staff.",
	category: "tickets",
	private: true,
	guildOnly: true,
	permissions: [PermissionFlagsBits.ManageGuild],
	botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],

	subcommands: [
		{
			name: "setup",
			description: "Posts the ticket panel and saves where tickets should go.",
			options: [
				{ name: "panel-channel", description: "Where the panel is posted.", type: "channel", required: true },
				{ name: "category", description: "The category new tickets are created in.", type: "channel", required: true },
				{
					name: "transcripts",
					description: "Where closed-ticket transcripts are sent.",
					type: "channel",
					required: true,
				},
				{ name: "staff-role", description: "The role that can see and handle tickets.", type: "role", required: true },
				{ name: "message", description: "The text shown on the panel.", type: "string", maxLength: 1_000 },
				{ name: "button-label", description: "The text on the button.", type: "string", maxLength: 40 },
			],

			async run(interaction) {
				const guild = inGuild(interaction);

				const panelChannel = textChannelOption(interaction, "panel-channel");
				if (!panelChannel)
					throw new UserFacingError(
						botCopy("Pick a channel I can post the panel in.", "اختر قناة يمكنني نشر لوحة التذاكر فيها."),
					);
				const language = readerLanguage(interaction);
				requirePostable(panelChannel, language, [PermissionFlagsBits.EmbedLinks]);

				const category = channelOption(interaction, "category");
				if (category?.type !== ChannelType.GuildCategory) {
					throw new UserFacingError(
						botCopy("The category has to be an actual channel category.", "اختر فئة من فئات القنوات في الخادم."),
					);
				}

				const transcripts = textChannelOption(interaction, "transcripts");
				if (!transcripts)
					throw new UserFacingError(
						botCopy("Pick a channel I can send transcripts to.", "اختر قناة يمكنني إرسال سجلات التذاكر إليها."),
					);
				requirePostable(transcripts, language, [PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]);

				const staffRole = roleOption(interaction, "staff-role", true);
				if (!staffRole)
					throw new UserFacingError(
						botCopy("Pick the role that should handle tickets.", "اختر الدور الذي سيتولّى متابعة التذاكر."),
					);

				const defaults = normaliseTicketSetup(null);
				const description = interaction.options.getString("message") ?? defaults.description;
				const buttonLabel = interaction.options.getString("button-label") ?? defaults.buttonLabel;

				const messageId = await publishTicketPanel(guild, {
					...defaults,
					panelChannelId: panelChannel.id,
					description,
					buttonLabel,
				});

				await saveTicketSetup(guild.id, {
					channelId: panelChannel.id,
					categoryId: category.id,
					transcriptChannelId: transcripts.id,
					handlerRoleId: staffRole.id,
					everyoneRoleId: guild.roles.everyone.id,
					description,
					buttonLabel,
					buttonEmoji: "🎫",
					messageId,
				});

				await reply(interaction, {
					embeds: [
						successEmbed(botCopy(`Ticket panel posted in ${panelChannel}.`, `نُشرت لوحة التذاكر في ${panelChannel}.`)),
					],
				});
			},
		},
		{
			name: "status",
			description: "Shows how tickets are currently configured.",
			async run(interaction) {
				const guild = inGuild(interaction);
				const setup = await getTicketSetup(guild.id);

				if (!setup)
					throw new UserFacingError(
						botCopy(
							"Tickets are not set up yet. Run `/ticket setup` first.",
							"لم يُضبط نظام التذاكر بعد. نفّذ `/ticket setup` أولًا.",
						),
					);

				await reply(interaction, {
					embeds: [
						embed({
							category: "tickets",
							title: botCopy("Ticket settings", "إعدادات التذاكر"),
							fields: [
								{ name: botCopy("Panel", "اللوحة"), value: `<#${setup.channelId}>`, inline: true },
								{ name: botCopy("Category", "الفئة"), value: `<#${setup.categoryId}>`, inline: true },
								{
									name: botCopy("Transcripts", "سجلات التذاكر"),
									value: `<#${setup.transcriptChannelId}>`,
									inline: true,
								},
								{ name: botCopy("Staff role", "دور المشرفين"), value: `<@&${setup.handlerRoleId}>`, inline: true },
							],
						}),
					],
				});
			},
		},
		{
			name: "disable",
			description: "Turns the ticket system off. Existing ticket channels are left alone.",
			async run(interaction) {
				const guild = inGuild(interaction);

				if (!(await deleteTicketSetup(guild.id))) {
					throw new UserFacingError(
						botCopy("Tickets were not set up in this server.", "لم يُضبط نظام التذاكر في هذا الخادم."),
					);
				}

				await reply(interaction, {
					embeds: [
						successEmbed(
							botCopy(
								"Tickets are off. The panel message can be deleted by hand.",
								"عُطّل نظام التذاكر. يمكنك حذف رسالة اللوحة يدويًا.",
							),
						),
					],
				});
			},
		},
	],
});
