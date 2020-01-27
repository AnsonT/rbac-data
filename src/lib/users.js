export async function createUser (tx, tenantId, { userName, email, password }) {}

export async function listUsers (tx, tenantId, { offset = 0, limit = 20 }) {}

export async function getUserById (tx, userId) {}

export async function getUserByNameOrEmail (tx, tenantId, { userName, email }) {}

export async function removeUser (tx, userId) {}

export async function updateUser (tx, userId, { userName, email }) {}
