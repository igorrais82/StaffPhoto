package com.staffphoto.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.staffphoto.app.databinding.ActivityMainBinding
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val viewModel: EmployeeViewModel by viewModels()
    private lateinit var adapter: EmployeeAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)

        adapter = EmployeeAdapter { employee ->
            startActivity(
                Intent(this, DetailActivity::class.java).putExtra(DetailActivity.EXTRA_ID, employee.id),
            )
        }
        binding.employeeList.layoutManager = LinearLayoutManager(this)
        binding.employeeList.adapter = adapter

        binding.searchInput.doAfterTextChanged { text ->
            viewModel.setQuery(text?.toString().orEmpty())
        }

        binding.addButton.setOnClickListener {
            startActivity(Intent(this, FormActivity::class.java))
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.employees.collect { list ->
                    adapter.submitList(list)
                    val empty = list.isEmpty()
                    binding.emptyText.visibility = if (empty) View.VISIBLE else View.GONE
                    binding.employeeList.visibility = if (empty) View.GONE else View.VISIBLE
                    binding.emptyText.text = if (viewModel.currentQuery.isBlank()) {
                        "Пока нет сотрудников.\nНажмите +, чтобы добавить."
                    } else {
                        "Ничего не найдено"
                    }
                }
            }
        }
    }
}
