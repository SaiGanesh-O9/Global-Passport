import { db, collection, addDoc } from '../firebase/firebase.js';

/**
 * Provider-Agnostic Notification Subsystem.
 * Delegates notifications to In-App, Email, and Push/SMS stubs.
 * Respects user settings and maps Actions, Priorities, and Templates.
 */

// Providers Config
const providers = {
  inApp: {
    send: async (userId, userEmail, payload) => {
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientId: userId || 'anonymous',
          recipientEmail: userEmail,
          title: payload.title,
          message: payload.message,
          category: payload.category || 'system',
          priority: payload.priority || 'Normal',
          action: payload.action || null,
          read: false,
          archived: false,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Firestore In-App notification save failed, logging locally:", err.message);
      }
    }
  },
  email: {
    send: async (userId, userEmail, payload) => {
      const emailHtml = buildEmailHTML(payload);
      const emailText = buildEmailPlainText(payload);

      // Log email delivery metrics to dev console
      console.log(`%c[EMAIL SEND] To: ${userEmail} | Subject: ${payload.title}`, 'background: #1e293b; color: #38bdf8; font-weight: bold; padding: 4px; border-radius: 4px;');
      console.log(`[Plain Text Summary]:\n${emailText}`);

      // Push to Firestore local emailQueue mock table for validation audits
      try {
        await addDoc(collection(db, 'emailQueue'), {
          recipientId: userId || 'anonymous',
          recipientEmail: userEmail,
          subject: payload.title,
          htmlBody: emailHtml,
          textBody: emailText,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Firestore emailQueue save failed:", err.message);
      }
    }
  },
  push: {
    send: async (userId, userEmail, payload) => {
      console.log(`[PUSH NOTIFICATION STUB] To: ${userEmail} | Title: ${payload.title}`);
    }
  },
  sms: {
    send: async (userId, userEmail, payload) => {
      console.log(`[SMS NOTIFICATION STUB] To: ${userEmail} | Message: ${payload.message}`);
    }
  }
};

/**
 * Core notification trigger entry.
 * Resolves Priority, Categories, Templates, and Action links.
 */
export async function sendNotification(userId, userEmail, triggerType, details = {}) {
  // Load preferences (Check default configuration values)
  const prefs = getPreferencesForUser(userId);

  // Resolve trigger meta
  const meta = resolveTriggerMetadata(triggerType, details);

  const payload = {
    title: meta.title,
    message: meta.message,
    category: meta.category,
    priority: meta.priority,
    action: meta.action,
    requestId: details.requestId || 'N/A',
    organizationName: details.organizationName || 'UniCrypt Hub',
    recipientName: details.recipientName || userEmail.split('@')[0]
  };

  // Route to In-App Provider
  if (prefs.delivery.inApp && prefs.events[meta.prefKey]) {
    await providers.inApp.send(userId, userEmail, payload);
  }

  // Route to Email Provider
  if (prefs.delivery.email && prefs.events[meta.prefKey]) {
    await providers.email.send(userId, userEmail, payload);
  }
}

/**
 * Returns default structured preferences. Can be customized by dashboard toggles.
 */
function getPreferencesForUser(userId) {
  // Load from local storage or return standard default settings
  const localPrefs = localStorage.getItem(`notif_prefs_${userId}`);
  if (localPrefs) {
    try {
      return JSON.parse(localPrefs);
    } catch (e) {
      // Fallback to default below
    }
  }

  return {
    delivery: {
      email: true,
      inApp: true,
      push: false
    },
    events: {
      verification: true,
      credential: true,
      organization: true,
      admin: true,
      security: true,
      system: true
    },
    frequency: 'Instant'
  };
}

/**
 * Maps triggers to Categories, Priorities, Actions, and Messages.
 */
function resolveTriggerMetadata(triggerType, details) {
  const applicant = details.recipientName || 'User';
  const org = details.organizationName || 'University';
  const service = details.serviceName || 'Document';

  switch (triggerType) {
    // 1. User events
    case 'VERIFICATION_SUBMITTED':
      return {
        title: 'Verification Request Submitted',
        message: `Your request for ${service} has been successfully submitted to ${org}.`,
        category: 'verification',
        priority: 'Normal',
        prefKey: 'verification',
        action: { type: 'SWITCH_TAB', hash: '#requests', label: 'View Request' }
      };
    case 'VERIFICATION_APPROVED':
      return {
        title: 'Verification Approved 🎉',
        message: `Congratulations! ${org} has approved your verification request for ${service}.`,
        category: 'verification',
        priority: 'Normal',
        prefKey: 'verification',
        action: { type: 'SWITCH_TAB', hash: '#vault', label: 'View Credential' }
      };
    case 'VERIFICATION_REJECTED':
      return {
        title: 'Verification Request Rejected',
        message: `${org} has rejected your request for ${service}. Reason: ${details.reason || 'Requirements unsatisfied.'}`,
        category: 'verification',
        priority: 'Normal',
        prefKey: 'verification',
        action: { type: 'SWITCH_TAB', hash: '#requests', label: 'Open Request' }
      };
    case 'INFO_REQUESTED':
      return {
        title: 'Information Requested',
        message: `${org} requires additional documents or answers to review your ${service} request.`,
        category: 'verification',
        priority: 'Normal',
        prefKey: 'verification',
        action: { type: 'OPEN_MODAL', modal: 'upload', label: 'Upload Missing Documents' }
      };
    case 'CREDENTIAL_EXPIRED':
      return {
        title: 'Credential Expired ⚠️',
        message: `Your verified ${service} credential has expired. Please submit a new upload.`,
        category: 'credential',
        priority: 'High',
        prefKey: 'credential',
        action: { type: 'SWITCH_TAB', hash: '#vault', label: 'View Credential' }
      };

    // 2. Organization events
    case 'NEW_REQUEST_ALERT':
      return {
        title: 'New Verification Request',
        message: `${applicant} has submitted a new request for ${service} verification.`,
        category: 'organization',
        priority: 'Normal',
        prefKey: 'organization',
        action: { type: 'SWITCH_TAB', hash: '#requests', label: 'Review Requests' }
      };
    case 'DOCUMENTS_REUPLOADED':
      return {
        title: 'Documents Re-uploaded',
        message: `${applicant} has uploaded the requested documents for ${service}.`,
        category: 'organization',
        priority: 'Normal',
        prefKey: 'organization',
        action: { type: 'SWITCH_TAB', hash: '#requests', label: 'Review Requests' }
      };

    // 3. Admin / Security Overrides
    case 'ADMIN_OVERRIDE_ALERT':
      return {
        title: 'Supreme Admin Override Completed',
        message: `An administrative override has force-updated your request status to: ${details.status}.`,
        category: 'admin',
        priority: 'High',
        prefKey: 'admin',
        action: { type: 'SWITCH_TAB', hash: '#logs', label: 'View Audit Log' }
      };
    case 'SECURITY_ALERT':
      return {
        title: 'Security Alert: Failed Logins Detected',
        message: `Multiple failed sign-in link attempts detected on email link sessions.`,
        category: 'security',
        priority: 'High',
        prefKey: 'security',
        action: { type: 'SWITCH_TAB', hash: '#settings', label: 'Audit settings' }
      };

    default:
      return {
        title: 'Platform Notification Alert',
        message: details.message || 'System status update notification.',
        category: 'system',
        priority: 'Low',
        prefKey: 'system',
        action: null
      };
  }
}

/**
 * Builds standard UniCrypt HTML Email Template.
 */
function buildEmailHTML(payload) {
  const origin = window.location.origin;
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 12px;">
        <span style="font-weight: 800; font-size: 20px; color: #1e3a8a;">🛡 UniCrypt</span>
        <span style="font-size: 11px; font-weight: bold; color: #64748b; margin-left: auto;">Security Alert Manager</span>
      </div>
      
      <div style="padding: 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        <p>Dear <strong>${payload.recipientName}</strong>,</p>
        <p>${payload.message}</p>
        
        <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 16px; background-color: #f8fafc; border-radius: 8px;">
          <tr>
            <td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Request ID:</td>
            <td style="padding: 8px 12px; color: #0f172a; font-family: monospace;">${payload.requestId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Institution:</td>
            <td style="padding: 8px 12px; color: #0f172a;">${payload.organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Timestamp:</td>
            <td style="padding: 8px 12px; color: #0f172a;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
        
        ${payload.action ? `
          <div style="margin-top: 24px; text-align: center;">
            <a href="${origin}/login" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block;">
              ${payload.action.label}
            </a>
          </div>
        ` : ''}
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center;">
        🛡 Magic links protect accounts from credential theft. Verification system rules apply.
      </div>
    </div>
  `;
}

/**
 * Builds standard Plain Text email backup.
 */
function buildEmailPlainText(payload) {
  return `
🛡 UNICRYPT NOTIFICATION
========================
Dear ${payload.recipientName},

${payload.message}

Details:
- Request ID: ${payload.requestId}
- Organization: ${payload.organizationName}
- Priority: ${payload.priority}
- Timestamp: ${new Date().toLocaleString()}

Action: Please login to your UniCrypt panel at ${window.location.origin}/login to complete required steps.
`;
}
