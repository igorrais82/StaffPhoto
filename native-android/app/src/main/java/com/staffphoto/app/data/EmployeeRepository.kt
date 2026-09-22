package com.staffphoto.app.data

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

class EmployeeRepository(context: Context) {
    private val appContext = context.applicationContext
    private val dao = AppDatabase.get(appContext).employeeDao()
    private val photosDir = File(appContext.filesDir, "employee-photos").also { it.mkdirs() }

    fun observeEmployees(): Flow<List<Employee>> = dao.observeAll()

    suspend fun getEmployee(id: Long): Employee? = dao.getById(id)

    suspend fun save(
        id: Long?,
        lastName: String,
        firstName: String,
        middleName: String,
        photoUri: Uri?,
        clearPhoto: Boolean,
    ): Long = withContext(Dispatchers.IO) {
        val existing = id?.let { dao.getById(it) }
        var photoPath = existing?.photoPath

        when {
            clearPhoto -> {
                existing?.photoPath?.let { File(it).delete() }
                photoPath = null
            }
            photoUri != null -> {
                existing?.photoPath?.let { File(it).delete() }
                photoPath = copyPhoto(photoUri)
            }
        }

        val now = System.currentTimeMillis()
        if (existing == null) {
            dao.insert(
                Employee(
                    lastName = lastName.trim(),
                    firstName = firstName.trim(),
                    middleName = middleName.trim(),
                    photoPath = photoPath,
                    createdAt = now,
                    updatedAt = now,
                ),
            )
        } else {
            dao.update(
                existing.copy(
                    lastName = lastName.trim(),
                    firstName = firstName.trim(),
                    middleName = middleName.trim(),
                    photoPath = photoPath,
                    updatedAt = now,
                ),
            )
            existing.id
        }
    }

    suspend fun delete(id: Long) = withContext(Dispatchers.IO) {
        val employee = dao.getById(id) ?: return@withContext
        employee.photoPath?.let { File(it).delete() }
        dao.delete(employee)
    }

    private fun copyPhoto(uri: Uri): String {
        val dest = File(photosDir, "${UUID.randomUUID()}.jpg")
        appContext.contentResolver.openInputStream(uri).use { input ->
            requireNotNull(input) { "Не удалось открыть фото" }
            dest.outputStream().use { output -> input.copyTo(output) }
        }
        return dest.absolutePath
    }
}
