package com.codeboi

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.testcontainers.containers.PostgreSQLContainer

class DatabaseIntegrationSpec : StringSpec({
    val pg = PostgreSQLContainer("postgres:16-alpine")
    beforeSpec {
        pg.start()
        initDb(pg.jdbcUrl)
    }
    afterSpec { pg.stop() }

    "can persist users with exposed on postgres" {
        transaction {
            UsersTable.insert {
                it[email] = "integration@example.com"
                it[passwordHash] = "hash"
            }
            UsersTable.selectAll().count() shouldBe 1
        }
    }
})
