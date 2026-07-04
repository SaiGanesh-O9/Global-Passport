const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'saiganeshkrovvidi.092005@gmail.com';

// -----------------------------------------------------------------
// Reusable Audit Logging Helper
// -----------------------------------------------------------------
async function logAdminAction(action, actorId, actorEmail, targetId, targetName, details) {
  const logRef = db.collection('auditLogs').doc();
  await logRef.set({
    action,
    actorId,
    actorEmail,
    targetId,
    targetName,
    details,
    timestamp: new Date().toISOString(),
  });
}

// -----------------------------------------------------------------
// Helper: Enforce Caller is Super Admin
// -----------------------------------------------------------------
async function verifySuperAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email;

  // Direct bypass check for the bootstrap email
  if (callerEmail === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
    return { uid: callerUid, email: callerEmail };
  }

  // Fetch role from Firestore
  const userSnap = await db.collection('users').doc(callerUid).get();
  if (!userSnap.exists || userSnap.data().role !== 'super_admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This operation requires Super Admin privileges.'
    );
  }

  return { uid: callerUid, email: callerEmail };
}

// -----------------------------------------------------------------
// Helper: Enforce Caller is Verifier for Org or Super Admin
// -----------------------------------------------------------------
async function verifyVerifierOrAdmin(context, requestOrgId) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email;

  if (callerEmail === BOOTSTRAP_SUPER_ADMIN_EMAIL) {
    return { uid: callerUid, email: callerEmail, isAdmin: true };
  }

  const userSnap = await db.collection('users').doc(callerUid).get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Caller profile not found.'
    );
  }

  const userData = userSnap.data();
  const isAdmin = userData.role === 'super_admin';
  const isOrgVerifier = userData.role === 'organization' && userData.organizationId === requestOrgId;

  if (!isAdmin && !isOrgVerifier) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not authorized to perform verification reviews for this organization.'
    );
  }

  return { uid: callerUid, email: callerEmail, isAdmin };
}

// -----------------------------------------------------------------
// 1. bootstrapSuperAdmin
// -----------------------------------------------------------------
exports.bootstrapSuperAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to trigger bootstrap check.'
    );
  }

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email;

  if (callerEmail !== BOOTSTRAP_SUPER_ADMIN_EMAIL) {
    return { status: 'ignored', message: 'Not matching bootstrap credentials.' };
  }

  const userRef = db.collection('users').doc(callerUid);
  const docSnap = await userRef.get();

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  if (!docSnap.exists) {
    await userRef.set({
      name: context.auth.token.name || callerEmail.split('@')[0],
      email: callerEmail,
      role: 'super_admin',
      organizationId: null,
      organizationName: null,
      organizationRole: null,
      status: 'active',
      createdAt: timestamp,
      lastLogin: timestamp,
    });
    
    await logAdminAction(
      'CREATE_USER',
      'system',
      'system@veriflash.com',
      callerUid,
      callerEmail,
      `Super admin account created via bootstrap.`
    );
  } else {
    const currentData = docSnap.data();
    if (currentData.role !== 'super_admin' || currentData.status !== 'active') {
      await userRef.update({
        role: 'super_admin',
        status: 'active',
        lastLogin: timestamp,
      });

      await logAdminAction(
        'UPDATE_USER',
        'system',
        'system@veriflash.com',
        callerUid,
        callerEmail,
        `Super Admin role/status boosted via login bootstrap.`
      );
    } else {
      await userRef.update({ lastLogin: timestamp });
    }
  }

  return { status: 'success', message: 'Bootstrap check resolved successfully.' };
});

// -----------------------------------------------------------------
// 2. createOrganization
// -----------------------------------------------------------------
exports.createOrganization = functions.https.onCall(async (data, context) => {
  const actor = await verifySuperAdmin(context);

  const { name, type, officialEmailDomain, website, status, verificationStatus } = data;
  if (!name || !type || !officialEmailDomain) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields (name, type, or officialEmailDomain).'
    );
  }

  const generatedId = `org-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  
  const orgRef = db.collection('organizations').doc(generatedId);
  const orgSnap = await orgRef.get();
  if (orgSnap.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      `An organization with ID ${generatedId} already exists.`
    );
  }

  const newOrg = {
    organizationId: generatedId,
    name: name.trim(),
    type,
    officialEmailDomain: officialEmailDomain.trim(),
    website: website.trim(),
    logoUrl: null,
    status: status || 'Active',
    verificationStatus: verificationStatus || 'Verified',
    createdAt: new Date().toISOString(),
  };

  await orgRef.set(newOrg);

  await logAdminAction(
    'CREATE_ORGANIZATION',
    actor.uid,
    actor.email,
    generatedId,
    newOrg.name,
    `Created organization "${newOrg.name}" with ID ${generatedId}`
  );

  return newOrg;
});

// -----------------------------------------------------------------
// 3. updateOrganization
// -----------------------------------------------------------------
exports.updateOrganization = functions.https.onCall(async (data, context) => {
  const actor = await verifySuperAdmin(context);

  const { organizationId, status, verificationStatus } = data;
  if (!organizationId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required organizationId.'
    );
  }

  const orgRef = db.collection('organizations').doc(organizationId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      `Organization with ID ${organizationId} not found.`
    );
  }

  const updates = {};
  if (status) updates.status = status;
  if (verificationStatus) updates.verificationStatus = verificationStatus;

  await orgRef.update(updates);

  await logAdminAction(
    'UPDATE_ORGANIZATION',
    actor.uid,
    actor.email,
    organizationId,
    orgSnap.data().name,
    `Updated organization "${orgSnap.data().name}" metadata: ${JSON.stringify(updates)}`
  );

  return { success: true };
});

// -----------------------------------------------------------------
// 4. deleteOrganization
// -----------------------------------------------------------------
exports.deleteOrganization = functions.https.onCall(async (data, context) => {
  const actor = await verifySuperAdmin(context);

  const { organizationId, name } = data;
  if (!organizationId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing organizationId.'
    );
  }

  // 1. Check if users are assigned
  const usersQuery = await db.collection('users')
    .where('organizationId', '==', organizationId)
    .limit(1)
    .get();
  if (!usersQuery.empty) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Cannot delete organization "${name}" because active user profiles reference it.`
    );
  }

  // 2. Check if requests reference this organization
  const reqsQuery = await db.collection('verificationRequests')
    .where('organization.id', '==', organizationId)
    .limit(1)
    .get();
  if (!reqsQuery.empty) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Cannot delete organization "${name}" because active verification requests reference it.`
    );
  }

  await db.collection('organizations').doc(organizationId).delete();

  await logAdminAction(
    'DELETE_ORGANIZATION',
    actor.uid,
    actor.email,
    organizationId,
    name,
    `Deleted organization "${name}"`
  );

  return { success: true };
});

// -----------------------------------------------------------------
// 5. assignOrganizationUser
// -----------------------------------------------------------------
exports.assignOrganizationUser = functions.https.onCall(async (data, context) => {
  const actor = await verifySuperAdmin(context);

  const {
    targetUserId,
    targetUserEmail,
    role,
    status,
    organizationId,
    organizationName,
    organizationRole
  } = data;

  if (!targetUserId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing targetUserId.'
    );
  }

  const userRef = db.collection('users').doc(targetUserId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Target user profile not found.'
    );
  }

  const isOrg = role === 'organization';

  const updatedFields = {
    role,
    status,
    organizationId: isOrg ? organizationId || null : null,
    organizationName: isOrg ? organizationName || null : null,
    organizationRole: isOrg ? organizationRole || null : null,
  };

  await userRef.update(updatedFields);

  await logAdminAction(
    'UPDATE_USER',
    actor.uid,
    actor.email,
    targetUserId,
    targetUserEmail || userSnap.data().email,
    `Updated role to ${role}, status to ${status}${isOrg ? ` (Org: ${organizationName}, Role: ${organizationRole})` : ''}`
  );

  return { success: true };
});

// -----------------------------------------------------------------
// 6. approveVerification
// -----------------------------------------------------------------
exports.approveVerification = functions.https.onCall(async (data, context) => {
  const { requestId, verificationId, verifiedAt, hash, timelineEntry } = data;
  if (!requestId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing requestId.'
    );
  }

  const reqRef = db.collection('verificationRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Verification request not found.'
    );
  }

  const reqData = reqSnap.data();
  const actor = await verifyVerifierOrAdmin(context, reqData.organization.id);

  const updates = {
    status: 'Approved',
    verificationId,
    verifiedAt,
    hash,
    timeline: admin.firestore.FieldValue.arrayUnion(timelineEntry)
  };

  await reqRef.update(updates);

  await logAdminAction(
    'APPROVE_REQUEST',
    actor.uid,
    actor.email,
    requestId,
    reqData.ownerName || 'Verification Request',
    `Approved verification request ${requestId}`
  );

  return { success: true };
});

// -----------------------------------------------------------------
// 7. rejectVerification
// -----------------------------------------------------------------
exports.rejectVerification = functions.https.onCall(async (data, context) => {
  const { requestId, timelineEntry } = data;
  if (!requestId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing requestId.'
    );
  }

  const reqRef = db.collection('verificationRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Verification request not found.'
    );
  }

  const reqData = reqSnap.data();
  const actor = await verifyVerifierOrAdmin(context, reqData.organization.id);

  await reqRef.update({
    status: 'Rejected',
    timeline: admin.firestore.FieldValue.arrayUnion(timelineEntry)
  });

  await logAdminAction(
    'REJECT_REQUEST',
    actor.uid,
    actor.email,
    requestId,
    reqData.ownerName || 'Verification Request',
    `Rejected verification request ${requestId}`
  );

  return { success: true };
});

// -----------------------------------------------------------------
// 8. requestInformation
// -----------------------------------------------------------------
exports.requestInformation = functions.https.onCall(async (data, context) => {
  const { requestId, timelineEntry } = data;
  if (!requestId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing requestId.'
    );
  }

  const reqRef = db.collection('verificationRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Verification request not found.'
    );
  }

  const reqData = reqSnap.data();
  const actor = await verifyVerifierOrAdmin(context, reqData.organization.id);

  await reqRef.update({
    status: 'Information Requested',
    timeline: admin.firestore.FieldValue.arrayUnion(timelineEntry)
  });

  await logAdminAction(
    'REQUEST_INFORMATION',
    actor.uid,
    actor.email,
    requestId,
    reqData.ownerName || 'Verification Request',
    `Requested additional information for request ${requestId}`
  );

  return { success: true };
});

// -----------------------------------------------------------------
// 9. revokeCredential
// -----------------------------------------------------------------
exports.revokeCredential = functions.https.onCall(async (data, context) => {
  const actor = await verifySuperAdmin(context);

  const { requestId, timelineEntry } = data;
  if (!requestId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing requestId.'
    );
  }

  const reqRef = db.collection('verificationRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Verification request not found.'
    );
  }

  const reqData = reqSnap.data();

  await reqRef.update({
    status: 'Rejected',
    timeline: admin.firestore.FieldValue.arrayUnion(timelineEntry)
  });

  await logAdminAction(
    'REVOKE_REQUEST',
    actor.uid,
    actor.email,
    requestId,
    reqData.ownerName || 'Verification Request',
    `Verification revoked by Super Admin (Request ID: ${requestId})`
  );

  return { success: true };
});

// -----------------------------------------------------------------
// 10. updatePlatformSettings
// -----------------------------------------------------------------
exports.updatePlatformSettings = functions.https.onCall(async (data, context) => {
  const actor = await verifySuperAdmin(context);

  const { maintenanceMode, allowSelfRegistration, maxUploadSizeMb } = data;

  const settingsRef = db.collection('settings').doc('platform');
  const updates = {
    maintenanceMode: !!maintenanceMode,
    allowSelfRegistration: !!allowSelfRegistration,
    maxUploadSizeMb: Number(maxUploadSizeMb || 20),
  };

  await settingsRef.set(updates);

  await logAdminAction(
    'UPDATE_SETTINGS',
    actor.uid,
    actor.email,
    'settings/platform',
    'Platform Settings',
    `Updated platform settings: Maintenance Mode = ${updates.maintenanceMode}, Max Upload Size = ${updates.maxUploadSizeMb}MB`
  );

  return { success: true };
});
