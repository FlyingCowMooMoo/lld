package com.codeboi

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe

class ConjugationSpec : StringSpec({
    "strong and weak form placeholders are type-safe" {
        Tense.PRESENT shouldBe Tense.valueOf("PRESENT")
        Mood.INDICATIVE shouldBe Mood.valueOf("INDICATIVE")
        Person.ICH shouldBe Person.valueOf("ICH")
    }

    "separable verbs keep prefix at sentence end" {
        val ex = VerbExercise(
            infinitive = "aufstehen",
            sentence = "Ich ____ um 7 Uhr ____.",
            translation = "I get up at 7.",
            expected = "stehe",
            separablePrefix = "auf",
        )
        ex.separablePrefix shouldBe "auf"
    }
})
