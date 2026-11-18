import {
	ChannelType,
	GuildExplicitContentFilter,
	GuildFeature,
	GuildNSFWLevel,
	GuildVerificationLevel,
} from "discord.js";
import { botCopy, usesArabicCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { UserFacingError } from "@core/errors";
import { embed, reply } from "@lib/discord";
import { discordTime, formatNumber, titleCase, truncate } from "@lib/format";

const TEXT_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum];
const VOICE_TYPES = [ChannelType.GuildVoice, ChannelType.GuildStageVoice];
const THREAD_TYPES = [ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread];

const ARABIC_FILTER: Record<GuildExplicitContentFilter, string> = {
	[GuildExplicitContentFilter.Disabled]: "معطّل",
	[GuildExplicitContentFilter.MembersWithoutRoles]: "للأعضاء بلا أدوار",
	[GuildExplicitContentFilter.AllMembers]: "لجميع الأعضاء",
};

const ARABIC_AGE: Record<GuildNSFWLevel, string> = {
	[GuildNSFWLevel.Default]: "عادي",
	[GuildNSFWLevel.Explicit]: "محتوى صريح",
	[GuildNSFWLevel.Safe]: "آمن",
	[GuildNSFWLevel.AgeRestricted]: "مقيّد بحسب العمر",
};

const ARABIC_VERIFICATION: Record<GuildVerificationLevel, string> = {
	[GuildVerificationLevel.None]: "بلا تحقق",
	[GuildVerificationLevel.Low]: "منخفض",
	[GuildVerificationLevel.Medium]: "متوسط",
	[GuildVerificationLevel.High]: "مرتفع",
	[GuildVerificationLevel.VeryHigh]: "مرتفع جدًا",
};

const ARABIC_FEATURES: Record<GuildFeature, string> = {
	[GuildFeature.AnimatedBanner]: "غلاف متحرك",
	[GuildFeature.AnimatedIcon]: "أيقونة متحركة",
	[GuildFeature.ApplicationCommandPermissionsV2]: "صلاحيات أوامر التطبيقات، الإصدار الثاني",
	[GuildFeature.AutoModeration]: "الإشراف التلقائي",
	[GuildFeature.Banner]: "غلاف للخادم",
	[GuildFeature.Community]: "خادم مجتمع",
	[GuildFeature.CreatorMonetizableProvisional]: "أهلية أولية لتحقيق الأرباح",
	[GuildFeature.CreatorStorePage]: "صفحة متجر صنّاع المحتوى",
	[GuildFeature.DeveloperSupportServer]: "خادم دعم المطوّرين",
	[GuildFeature.Discoverable]: "يمكن اكتشافه",
	[GuildFeature.Featurable]: "مؤهّل للظهور ضمن الخوادم المميّزة",
	[GuildFeature.HasDirectoryEntry]: "مدرج في دليل الخوادم",
	[GuildFeature.Hub]: "مركز للخوادم",
	[GuildFeature.InvitesDisabled]: "الدعوات معطّلة",
	[GuildFeature.InviteSplash]: "خلفية مخصّصة للدعوة",
	[GuildFeature.LinkedToHub]: "مرتبط بمركز للخوادم",
	[GuildFeature.MemberVerificationGateEnabled]: "التحقق عند الانضمام",
	[GuildFeature.MoreSoundboard]: "خانات إضافية للمؤثرات الصوتية",
	[GuildFeature.MonetizationEnabled]: "تحقيق الأرباح مفعّل",
	[GuildFeature.MoreStickers]: "خانات إضافية للملصقات",
	[GuildFeature.News]: "قنوات الإعلانات",
	[GuildFeature.Partnered]: "خادم شريك",
	[GuildFeature.PreviewEnabled]: "تتيح معاينة الخادم",
	[GuildFeature.PrivateThreads]: "سلاسل محادثات خاصة",
	[GuildFeature.RaidAlertsDisabled]: "تنبيهات الإغراق معطّلة",
	[GuildFeature.RelayEnabled]: "ترحيل الرسائل مفعّل",
	[GuildFeature.RoleIcons]: "أيقونات الأدوار",
	[GuildFeature.RoleSubscriptionsAvailableForPurchase]: "اشتراكات الأدوار متاحة للشراء",
	[GuildFeature.RoleSubscriptionsEnabled]: "اشتراكات الأدوار مفعّلة",
	[GuildFeature.Soundboard]: "لوحة المؤثرات الصوتية",
	[GuildFeature.TicketedEventsEnabled]: "فعاليات بتذاكر",
	[GuildFeature.VanityURL]: "رابط مختصر مخصّص",
	[GuildFeature.Verified]: "خادم موثّق",
	[GuildFeature.VIPRegions]: "مناطق اتصال صوتي مميّزة",
	[GuildFeature.WelcomeScreenEnabled]: "شاشة الترحيب مفعّلة",
	[GuildFeature.GuildTags]: "وسوم الخادم",
	[GuildFeature.EnhancedRoleColors]: "ألوان متقدمة للأدوار",
	[GuildFeature.GuestsEnabled]: "الدخول بصفة ضيف",
	[GuildFeature.PinPermissionMigrationComplete]: "اكتمل تحديث صلاحية تثبيت الرسائل",
};

export default defineCommand({
	name: "server-info",
	description: "Displays information about this server.",
	category: "info",
	private: true,
	aliases: ["server", "guildinfo"],
	guildOnly: true,

	async run(interaction) {
		const guild = interaction.guild;
		if (!guild)
			throw new UserFacingError(
				botCopy("This command only works inside a server.", "يعمل هذا الأمر داخل الخوادم فقط."),
			);

		await interaction.deferReply();
		await guild.members.fetch().catch(() => null);

		const bots = guild.members.cache.filter((member) => member.user.bot).size;
		const humans = guild.memberCount - bots;

		const count = (types: ChannelType[]): number =>
			guild.channels.cache.filter((channel) => types.includes(channel.type)).size;

		const roles = guild.roles.cache.filter((role) => role.name !== "@everyone").sort((a, b) => b.position - a.position);

		const builder = embed({
			category: "info",
			title: guild.name,
			description: guild.description ?? botCopy("No description set.", "لم يُضبط وصف للخادم."),
			fields: [
				{
					name: botCopy("General", "معلومات عامة"),
					value: [
						`📜 **${botCopy("Created", "أُنشئ")}** ${discordTime(guild.createdAt, "R")}`,
						`💳 **${botCopy("ID", "المعرّف")}** ${guild.id}`,
						`👑 **${botCopy("Owner", "المالك")}** <@${guild.ownerId}>`,
						`🌍 **${botCopy("Language", "اللغة")}** ${localeName(guild.preferredLocale)}`,
						`💻 **${botCopy("Vanity URL", "الرابط المخصص")}** ${guild.vanityURLCode ?? botCopy("None", "لا يوجد")}`,
					].join("\n"),
				},
				{
					name: botCopy("Security", "الأمان"),
					value: [
						`👀 **${botCopy("Explicit filter", "تصفية المحتوى الصريح")}** ${botCopy(titleCase(GuildExplicitContentFilter[guild.explicitContentFilter]), ARABIC_FILTER[guild.explicitContentFilter])}`,
						`🔞 **${botCopy("NSFW level", "التصنيف العمري")}** ${botCopy(titleCase(GuildNSFWLevel[guild.nsfwLevel]), ARABIC_AGE[guild.nsfwLevel])}`,
						`🔒 **${botCopy("Verification", "مستوى التحقق")}** ${botCopy(titleCase(GuildVerificationLevel[guild.verificationLevel]), ARABIC_VERIFICATION[guild.verificationLevel])}`,
					].join("\n"),
					inline: true,
				},
				{
					name: botCopy(`Members (${formatNumber(guild.memberCount)})`, `الأعضاء (${formatNumber(guild.memberCount)})`),
					value: [
						`👥 **${botCopy("People", "الأعضاء")}** ${formatNumber(humans)}`,
						`🤖 **${botCopy("Bots", "البوتات")}** ${formatNumber(bots)}`,
					].join("\n"),
					inline: true,
				},
				{
					name: botCopy("Boosts", "التعزيزات"),
					value: [
						`📈 **${botCopy("Tier", "المستوى")}** ${guild.premiumTier}`,
						`💎 **${botCopy("Boosts", "عدد التعزيزات")}** ${guild.premiumSubscriptionCount ?? 0}`,
					].join("\n"),
					inline: true,
				},
				{
					name: botCopy(`Channels (${guild.channels.cache.size})`, `القنوات (${guild.channels.cache.size})`),
					value: [
						`💬 **${botCopy("Text", "نصية")}** ${count(TEXT_TYPES)}`,
						`🔊 **${botCopy("Voice", "صوتية")}** ${count(VOICE_TYPES)}`,
						`🧵 **${botCopy("Threads", "سلاسل المحادثات")}** ${count(THREAD_TYPES)}`,
						`📑 **${botCopy("Categories", "الفئات")}** ${count([ChannelType.GuildCategory])}`,
					].join("\n"),
					inline: true,
				},
				{
					name: botCopy(
						`Emojis & stickers (${guild.emojis.cache.size + guild.stickers.cache.size})`,
						`الرموز التعبيرية والملصقات (${guild.emojis.cache.size + guild.stickers.cache.size})`,
					),
					value: [
						`📺 **${botCopy("Animated", "متحركة")}** ${guild.emojis.cache.filter((emoji) => emoji.animated).size}`,
						`🗿 **${botCopy("Static", "ثابتة")}** ${guild.emojis.cache.filter((emoji) => !emoji.animated).size}`,
						`🏷 **${botCopy("Stickers", "الملصقات")}** ${guild.stickers.cache.size}`,
					].join("\n"),
					inline: true,
				},
				{
					name: botCopy("Features", "الميزات"),
					value: truncate(
						guild.features.map((feature) => `- ${botCopy(titleCase(feature), ARABIC_FEATURES[feature])}`).join("\n") ||
							botCopy("None", "لا يوجد"),
						1_000,
					),
					inline: true,
				},
				{
					name: botCopy(`Roles (${roles.size})`, `الأدوار (${roles.size})`),
					value: truncate(roles.map((role) => role.toString()).join(" ") || botCopy("None", "لا يوجد"), 1_000),
				},
			],
			footer: `${guild.name} • ${guild.id}`,
			...(guild.iconURL() !== null ? { thumbnail: guild.iconURL({ size: 1024 })! } : {}),
			...(guild.bannerURL() !== null ? { image: guild.bannerURL({ size: 1024 })! } : {}),
		});

		await reply(interaction, { embeds: [builder] });
	},
});

function localeName(locale: string): string {
	try {
		return new Intl.DisplayNames([usesArabicCopy() ? "ar" : "en"], { type: "language" }).of(locale) ?? locale;
	} catch {
		return locale;
	}
}
