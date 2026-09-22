package com.staffphoto.app.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface EmployeeDao {
    @Query("SELECT * FROM employees ORDER BY lastName COLLATE LOCALIZED ASC, firstName COLLATE LOCALIZED ASC")
    fun observeAll(): Flow<List<Employee>>

    @Query("SELECT * FROM employees WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): Employee?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(employee: Employee): Long

    @Update
    suspend fun update(employee: Employee)

    @Delete
    suspend fun delete(employee: Employee)
}
