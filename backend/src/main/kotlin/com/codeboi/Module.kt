package com.codeboi

import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.plugins.callloging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import kotlinx.serialization.Serializable

@Serializable
enum class Tense { PRESENT }

@Serializable
enum class Mood { INDICATIVE }

@Serializable
enum class Person { ICH, DU, ER_SIE_ES, WIR, IHR, SIE }

@Serializable
data class VerbExercise(
    val infinitive: String,
    val sentence: String,
    val translation: String,
    val expected: String,
    val separablePrefix: String? = null,
    val tense: Tense = Tense.PRESENT,
    val mood: Mood = Mood.INDICATIVE,
    val person: Person = Person.ICH,
)

@Serializable
data class RoundState(val roundId: String, val index: Int, val score: Int, val total: Int, val exercise: VerbExercise?)

@Serializable
data class SubmitRequest(val roundId: String, val answer: String)

@Serializable
data class StartRoundRequest(val presetId: String)

@Serializable
data class AuthPayload(val email: String, val password: String)

@Serializable
data class ApiResponse<T>(val data: T)

@Serializable
data class SubmitResult(val correct: Boolean, val expected: String, val score: Int)

private val users = mutableSetOf("test@example.com")
private val sessions = mutableSetOf<String>()
private val rounds = mutableMapOf<String, Round>()

private data class Round(val presetId: String, var index: Int = 0, var score: Int = 0, val exercises: List<VerbExercise>)

private val presets = mapOf(
    "basic" to listOf(
        VerbExercise("machen", "Ich ____ meine Hausaufgaben.", "I do my homework.", "mache"),
        VerbExercise("gehen", "Wir ____ heute ins Kino.", "We go to the cinema today.", "gehen", person = Person.WIR),
    ),
    "separable" to listOf(
        VerbExercise("aufstehen", "Ich ____ um 7 Uhr ____.", "I get up at 7.", "stehe", separablePrefix = "auf"),
    ),
)

fun Application.module() {
    initDb()
    install(CallLogging)
    install(ContentNegotiation) { json() }

    routing {
        get("/health") { call.respond(ApiResponse("ok")) }

        route("/api/auth") {
            post("/register") {
                val payload = call.receive<AuthPayload>()
                users += payload.email
                call.respond(HttpStatusCode.Created, ApiResponse("registered"))
            }
            post("/login") {
                val payload = call.receive<AuthPayload>()
                if (users.contains(payload.email)) {
                    sessions += payload.email
                    call.respond(ApiResponse(mapOf("token" to payload.email)))
                } else {
                    call.respond(HttpStatusCode.Unauthorized, ApiResponse("invalid_credentials"))
                }
            }
            post("/test-login") {
                sessions += "test@example.com"
                call.respond(ApiResponse(mapOf("token" to "test@example.com")))
            }
            post("/logout") {
                val payload = call.receive<Map<String, String>>()
                sessions.remove(payload["token"] ?: "")
                call.respond(ApiResponse("logged_out"))
            }
        }

        get("/api/me") {
            val token = call.request.queryParameters["token"]
            if (token == null || !sessions.contains(token)) {
                call.respond(HttpStatusCode.Unauthorized, ApiResponse("unauthorized"))
            } else {
                call.respond(ApiResponse(mapOf("email" to token)))
            }
        }

        get("/api/categories") {
            call.respond(ApiResponse(listOf("Verb Conjugation", "Separable Verbs")))
        }

        get("/api/presets") {
            call.respond(ApiResponse(presets.keys.toList()))
        }

        post("/api/round/start") {
            val req = call.receive<StartRoundRequest>()
            val exercises = presets[req.presetId] ?: emptyList()
            val roundId = "round-${System.currentTimeMillis()}"
            rounds[roundId] = Round(req.presetId, exercises = exercises)
            val ex = exercises.firstOrNull()
            call.respond(ApiResponse(RoundState(roundId, 0, 0, exercises.size, ex)))
        }

        post("/api/round/submit") {
            val req = call.receive<SubmitRequest>()
            val round = rounds[req.roundId]
            if (round == null) {
                call.respond(HttpStatusCode.NotFound, ApiResponse("round_not_found"))
                return@post
            }
            val expected = round.exercises[round.index].expected
            val correct = req.answer.trim().equals(expected, ignoreCase = true)
            if (correct) round.score += 1
            call.respond(ApiResponse(SubmitResult(correct, expected, round.score)))
        }

        post("/api/round/next") {
            val payload = call.receive<Map<String, String>>()
            val round = rounds[payload["roundId"]]
            if (round == null) {
                call.respond(HttpStatusCode.NotFound, ApiResponse("round_not_found"))
                return@post
            }
            round.index += 1
            val ex = round.exercises.getOrNull(round.index)
            call.respond(ApiResponse(RoundState(payload["roundId"]!!, round.index, round.score, round.exercises.size, ex)))
        }
    }
}
