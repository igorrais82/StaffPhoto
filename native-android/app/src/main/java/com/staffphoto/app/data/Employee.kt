package com.staffphoto.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "employees")
data class Employee(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val lastName: String,
    val firstName: String,
    val middleName: String,
    val photoPath: String?,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
) {
    fun fullName(): String =
        listOf(lastName, firstName, middleName)
            .filter { it.isNotBlank() }
            .joinToString(" ")
}
