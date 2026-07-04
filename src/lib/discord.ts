import type { ApplicantSettings, CompanyReport } from "@/types";

export function isDiscordConfigured(): boolean {
  return !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID);
}

export async function sendReportToDiscord(
  report: CompanyReport,
  pdfBuffer: Buffer,
  applicant: ApplicantSettings
): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    throw new Error("Discord is not configured. Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID.");
  }

  const embed = {
    title: "📊 New Company Research Report",
    color: 0x6366f1,
    fields: [
      {
        name: "👤 Applicant Name",
        value: applicant.applicantName || "Not provided",
        inline: true,
      },
      {
        name: "📧 Applicant Email",
        value: applicant.applicantEmail || "Not provided",
        inline: true,
      },
      {
        name: "🏢 Company Name",
        value: report.companyName,
        inline: true,
      },
      {
        name: "🌐 Company Website",
        value: report.website,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "Company Research Assistant" },
  };

  const formData = new FormData();
  formData.append(
    "payload_json",
    JSON.stringify({ embeds: [embed] })
  );

  const safeName = report.companyName.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
  const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
  formData.append("files[0]", pdfBlob, `${safeName}_report.pdf`);

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bot ${token}` },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Discord API error: ${response.status} - ${err}`);
  }
}
