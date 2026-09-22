package com.staffphoto.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.staffphoto.app.data.Employee
import com.staffphoto.app.data.EmployeeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class EmployeeViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = EmployeeRepository(application)
    private val query = MutableStateFlow("")

    val currentQuery: String get() = query.value

    val employees: StateFlow<List<Employee>> =
        combine(repository.observeEmployees(), query) { list, q ->
            if (q.isBlank()) list
            else list.filter { it.fullName().contains(q.trim(), ignoreCase = true) }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun setQuery(value: String) {
        query.value = value
    }

    suspend fun get(id: Long): Employee? = repository.getEmployee(id)

    fun save(
        id: Long?,
        lastName: String,
        firstName: String,
        middleName: String,
        photoUri: android.net.Uri?,
        clearPhoto: Boolean,
        onDone: (Long) -> Unit,
    ) {
        viewModelScope.launch {
            val savedId = repository.save(id, lastName, firstName, middleName, photoUri, clearPhoto)
            onDone(savedId)
        }
    }

    fun delete(id: Long, onDone: () -> Unit) {
        viewModelScope.launch {
            repository.delete(id)
            onDone()
        }
    }
}
