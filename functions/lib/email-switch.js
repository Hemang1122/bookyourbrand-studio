"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAILS_ENABLED = void 0;
exports.withEmailSwitch = withEmailSwitch;
/**
 * Master switch for every email the CRM sends.
 * false = no emails are sent (in-app notifications still work).
 * Set to true and redeploy to turn emails back on.
 */
exports.EMAILS_ENABLED = false;
function withEmailSwitch(transporter) {
    if (!exports.EMAILS_ENABLED) {
        transporter.sendMail = async () => {
            console.log('Email not sent: CRM emails are turned off (email-switch.ts).');
            return { messageId: 'emails-disabled', accepted: [], rejected: [] };
        };
    }
    return transporter;
}
//# sourceMappingURL=email-switch.js.map