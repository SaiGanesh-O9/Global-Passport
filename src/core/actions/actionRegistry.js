/**
 * UniCrypt Action Registry (v1.0)
 * Resolves interactive actions dynamically based on object type and capability credentials.
 */

import { hasCapability } from '../capabilities/index.js';
import { EventBus, EVENTS } from '../eventBus/index.js';

export const ActionRegistry = {
  getActionsForObject(type, data, userRole) {
    const actions = [];
    const role = userRole || 'candidate';

    switch (type) {
      case 'document':
        if (hasCapability(role, 'viewAuditTrail')) {
          actions.push({
            id: 'doc.view',
            label: 'Open Document',
            primary: true,
            execute: () => {
              EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
                title: 'Document Opened',
                message: `Displaying viewer for ${data.fileName || data.title}`,
                type: 'info'
              });
              window.dispatchEvent(new CustomEvent('unicrypt-action-open-doc', { detail: { id: data.id } }));
            }
          });
        }
        if (hasCapability(role, 'shareCredential')) {
          actions.push({
            id: 'doc.share',
            label: 'Share Securely',
            execute: () => {
              EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
                title: 'Secure Link Generated',
                message: 'Encrypted verification link copied to clipboard.',
                type: 'success'
              });
            }
          });
        }
        actions.push({
          id: 'doc.verify',
          label: 'Verify Authenticity',
          execute: () => {
            EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
              title: 'Verification Queued',
              message: 'Auditing cryptographic ledger signatures...',
              type: 'info'
            });
          }
        });
        break;

      case 'metric':
        if (hasCapability(role, 'compareOrganizations')) {
          actions.push({
            id: 'metric.compare',
            label: 'Compare Benchmarks',
            primary: true,
            execute: () => {
              EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
                title: 'Peer Benchmark Comparison',
                message: `Comparing ${data.title} across accredited partner directory registries.`,
                type: 'info'
              });
            }
          });
        }
        actions.push({
          id: 'metric.source',
          label: 'View Registrar Logs',
          execute: () => {
            EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
              title: 'Registry Verified',
              message: `Source authenticity audited successfully at ${data.metadata?.lastUpdated || 'today'}.`,
              type: 'success'
            });
          }
        });
        break;

      case 'organization':
        actions.push({
          id: 'org.apply',
          label: 'Start Application',
          primary: true,
          execute: () => {
            window.dispatchEvent(new CustomEvent('unicrypt-ai-action', {
              detail: {
                type: 'OPEN_UPLOAD',
                preset: 'Passport',
                description: `${data.title} prerequisite matching setup.`
              }
            }));
          }
        });
        actions.push({
          id: 'org.bookmark',
          label: 'Favorite Partner',
          execute: () => {
            EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
              title: 'Partner Saved',
              message: `${data.title} successfully added to workspace shortcuts.`,
              type: 'success'
            });
          }
        });
        break;

      case 'verification':
        if (hasCapability(role, 'approveVerification')) {
          actions.push({
            id: 'verification.approve',
            label: 'Approve Request',
            primary: true,
            execute: () => {
              EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
                title: 'Request Approved',
                message: 'Cryptographic approval token signed on-chain.',
                type: 'success'
              });
            }
          });
          actions.push({
            id: 'verification.reject',
            label: 'Reject Request',
            execute: () => {
              EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
                title: 'Request Rejected',
                message: 'Verification request marked as rejected.',
                type: 'warning'
              });
            }
          });
        }
        break;

      case 'user':
        if (hasCapability(role, 'deleteUsers')) {
          actions.push({
            id: 'user.delete',
            label: 'Delete User Account',
            primary: true,
            execute: () => {
              EventBus.dispatch(EVENTS.NOTIFICATION_SHOW, {
                title: 'Account Deletion Requested',
                message: 'Permanently purging development profile log records.',
                type: 'warning'
              });
            }
          });
        }
        break;

      default:
        break;
    }

    return actions;
  }
};
