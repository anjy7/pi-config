/** Windows desktop alerts for Pi's approval/question dialogs. No approval policy changes. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);

// Static content deliberately keeps commands, prompts, and secrets off the lock screen.
// Register only our per-user sender identity; never enable notifications over user preferences.
const toastScript = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$appId = 'Pi.Agent.DesktopAlerts'
$identityPath = "HKCU:\Software\Classes\AppUserModelId\$appId"
$null = New-Item -Path $identityPath -Force
$null = New-ItemProperty -Path $identityPath -Name DisplayName -Value 'Pi' -PropertyType String -Force
$null = New-ItemProperty -Path $identityPath -Name ShowInSettings -Value 1 -PropertyType DWord -Force
$settingsPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings\$appId"
if (!(Test-Path $settingsPath)) {
    $null = New-Item -Path $settingsPath -Force
    $null = New-ItemProperty -Path $settingsPath -Name ShowInActionCenter -Value 1 -PropertyType DWord
}
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId)
$status = [string]$notifier.Setting
# Some Windows/PowerShell versions expose Setting as null. Null is not "disabled".
$globalSettings = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications' -ErrorAction SilentlyContinue
$appSettings = Get-ItemProperty $settingsPath -ErrorAction SilentlyContinue
if ($globalSettings.ToastEnabled -eq 0) { $status = 'DisabledForUser' }
elseif ($appSettings.Enabled -eq 0) { $status = 'DisabledForApplication' }
if ($status -in @('DisabledForUser', 'DisabledForApplication', 'DisabledByGroupPolicy', 'DisabledByManifest')) {
    @{ status = $status } | ConvertTo-Json -Compress
    exit 0
}
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml('<toast><visual><binding template="ToastGeneric"><text>Pi needs your attention</text><text>An approval or question is waiting. Return to your terminal to respond.</text></binding></visual></toast>')
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$notifier.Show($toast)
@{ status = 'submitted' } | ConvertTo-Json -Compress
`;

const statusMessages: Record<string, string> = {
	DisabledForUser: "Windows notifications are disabled globally. Open Settings > System > Notifications and enable the main Notifications switch.",
	DisabledForApplication: "Pi notifications are disabled. Enable Pi under Settings > System > Notifications.",
	DisabledByGroupPolicy: "Windows notification policy blocks Pi desktop alerts. Contact your administrator.",
	DisabledByManifest: "Windows rejected Pi's notification sender registration.",
};

async function sendToast(): Promise<string> {
	const { stdout } = await execFileAsync("powershell.exe", [
		"-NoProfile", "-NonInteractive", "-EncodedCommand",
		Buffer.from(toastScript, "utf16le").toString("base64"),
	], { windowsHide: true, timeout: 10_000, maxBuffer: 64 * 1024 });
	const result: unknown = JSON.parse(stdout.trim());
	if (!result || typeof result !== "object" || !("status" in result) || typeof result.status !== "string") {
		throw new Error("Invalid Windows notification result");
	}
	return result.status;
}

export default function (pi: ExtensionAPI) {
	if (process.platform !== "win32") return;

	const notify = async (ctx: ExtensionContext, test = false): Promise<void> => {
		try {
			const status = await sendToast();
			if (status !== "submitted") {
				ctx.ui.notify(statusMessages[status] ?? "Windows returned an unknown notification status. Run /notification-test again.", "warning");
			} else if (test) {
				ctx.ui.notify("Test alert submitted as Pi. If no banner appears, check Win+N and Do not disturb.", "info");
			}
		} catch {
			// Never approve, reject, or otherwise interrupt the waiting dialog on failure.
			ctx.ui.notify("Pi could not send a desktop alert. Check Windows notifications and PowerShell; approvals are unchanged.", "warning");
		}
	};

	pi.on("ui_prompt_start", (_event, ctx) => {
		if (ctx.mode !== "tui") return;
		// Includes custom dialogs used by bash-guard and ask-user-question.
		// Fire-and-forget: desktop alerts must not delay the actual permission prompt.
		void notify(ctx);
	});

	pi.registerCommand("notification-test", {
		description: "Send a test Windows desktop notification",
		handler: async (_args, ctx) => { await notify(ctx, true); },
	});
}
