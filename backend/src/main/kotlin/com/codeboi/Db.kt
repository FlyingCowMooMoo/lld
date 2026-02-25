package com.codeboi

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.transactions.transaction

object UsersTable : Table("users") {
    val email = varchar("email", 255).uniqueIndex()
    val passwordHash = varchar("password_hash", 255)
    override val primaryKey = PrimaryKey(email)
}

fun initDb(url: String = System.getenv("JDBC_DATABASE_URL") ?: "jdbc:h2:mem:app;DB_CLOSE_DELAY=-1") {
    Database.connect(url, driver = if (url.contains("postgres")) "org.postgresql.Driver" else "org.h2.Driver")
    transaction { SchemaUtils.create(UsersTable) }
}
