
exports.up = async function (knex) {
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('tenantId').primary().notNullable()
    table.string('tenantName').unique().notNullable()
    table.string('domain').unique().notNullable()
    table.datetime('createdAt').defaultTo(knex.fn.now())
    table.datetime('modifiedAt').defaultTo(knex.fn.now())
  })

  await knex.schema.createTable('users', (table) => {
    table.uuid('userId').primary().notNullable()
    table.uuid('tenantId').notNullable().defaultTo('00000000-0000-0000-0000-000000000000')
    table.string('userName', 64).unique().notNullable()
    table.string('email', 64)
    table.datetime('emailVerifiedAt')
    table.boolean('needNewPassword').defaultTo(false)
    table.datetime('createdAt').defaultTo(knex.fn.now())
    table.datetime('modifiedAt').defaultTo(knex.fn.now())
    table.index('userName')
    table.index('email')
    table.foreign('tenantId').references('tenantId').inTable('tenants').onDelete('CASCADE')
  })

  await knex.schema.createTable('logins', (table) => {
    table.uuid('loginId').primary().notNullable()
    table.uuid('userId').notNullable()
    table.string('passwordHash', 128).notNullable()
    table.datetime('createdAt').defaultTo(knex.fn.now())
    table.foreign('userId').references('userId').inTable('users').onDelete('CASCADE')
  })

  await knex.schema.createTable('loginAttempts', (table) => {
    table.datetime('loginAt').defaultTo(knex.fn.now())
    table.uuid('userId')
    table.boolean('success')
    table.string('loginIp')
    table.index('loginAt')
    table.index('userId')
    table.foreign('userId').references('userId').inTable('users').onDelete('CASCADE')
  })

  await knex.schema.createTable('emailVerifications', (table) => {
    table.uuid('verificationId').primary().notNullable()
    table.uuid('userId').notNullable()
    table.string('verificationCode').notNullable()
    table.string('email', 64).notNullable()
    table.datetime('requestAt').notNullable().defaultTo(knex.fn.now())
    table.datetime('expireAt').notNullable()
    table.datetime('verifiedAt')
    table.index('verificationCode')
    table.foreign('userId').references('userId').inTable('users').onDelete('CASCADE')
  })

  await knex.schema.createTable('passwordResetRequests', (table) => {
    table.uuid('requestId').primary().notNullable()
    table.uuid('userId').notNullable()
    table.string('requestCode').unique().notNullable()
    table.datetime('requestAt').defaultTo(knex.fn.now())
    table.datetime('expireAt').notNullable()
    table.string('requestIp')
    table.datetime('resetAt')
    table.string('resetIp')
    table.foreign('userId').references('userId').inTable('users').onDelete('CASCADE')
  })

  await knex.schema.createTable('roles', (table) => {
    table.uuid('roleId').primary().notNullable()
    table.uuid('tenantId').notNullable().defaultTo('00000000-0000-0000-0000-000000000000')
    table.string('roleName', 64).unique().notNullable()
    table.text('description')
    table.datetime('createdAt').defaultTo(knex.fn.now())
    table.datetime('modifiedAt').defaultTo(knex.fn.now())
    table.foreign('tenantId').references('tenantId').inTable('tenants').onDelete('CASCADE')
  })

  await knex.schema.createTable('usersRoles', (table) => {
    table.uuid('userId').notNullable()
    table.uuid('roleId').notNullable()
    table.datetime('createdAt').defaultTo(knex.fn.now())
    table.primary(['userId', 'roleId'])
    table.index(['userId', 'roleId'])
    table.foreign('userId').references('userId').inTable('users').onDelete('CASCADE')
    table.foreign('roleId').references('roleId').inTable('roles').onDelete('CASCADE')
  })

  await knex.schema.createTable('permissions', (table) => {
    table.uuid('permissionId').primary().notNullable()
    table.uuid('tenantId').notNullable().defaultTo('00000000-0000-0000-0000-000000000000')
    table.string('permission', 64).notNullable()
    table.string('description', 256)
    table.datetime('createdAt').defaultTo(knex.fn.now())
    table.foreign('tenantId').references('tenantId').inTable('tenants').onDelete('CASCADE')
  })

  await knex.schema.createTable('rolesPermissions', (table) => {
    table.uuid('roleId').notNullable()
    table.uuid('permissionId').notNullable()
    table.datetime('createdAt').defaultTo(knex.fn.now())
    table.foreign('roleId').references('roleId').inTable('roles').onDelete('CASCADE')
    table.foreign('permissionId').references('permissionId').inTable('permissions').onDelete('CASCADE')
  })

  await knex('tenants')
    .insert([
      {
        tenantId: '00000000-0000-0000-0000-000000000000',
        tenantName: 'root',
        domain: process.env.ROOT_DOMAIN || 'example.localhost'
      }
    ])
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('rolesPermissions')
  await knex.schema.dropTableIfExists('permissions')
  await knex.schema.dropTableIfExists('usersRoles')
  await knex.schema.dropTableIfExists('roles')
  await knex.schema.dropTableIfExists('passwordResetRequests')
  await knex.schema.dropTableIfExists('emailVerifications')
  await knex.schema.dropTableIfExists('loginAttempts')
  await knex.schema.dropTableIfExists('logins')
  await knex.schema.dropTableIfExists('users')
  await knex.schema.dropTableIfExists('tenants')
}
