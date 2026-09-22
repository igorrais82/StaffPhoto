package com.staffphoto.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.staffphoto.app.databinding.ActivityDetailBinding
import kotlinx.coroutines.launch
import java.io.File

class DetailActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDetailBinding
    private val viewModel: EmployeeViewModel by viewModels()
    private var employeeId: Long = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        employeeId = intent.getLongExtra(EXTRA_ID, -1)
        binding.toolbar.setNavigationOnClickListener { finish() }
        binding.toolbar.setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)

        binding.editButton.setOnClickListener {
            startActivity(
                Intent(this, FormActivity::class.java).putExtra(FormActivity.EXTRA_ID, employeeId),
            )
        }
        binding.deleteButton.setOnClickListener { confirmDelete() }
    }

    override fun onResume() {
        super.onResume()
        load()
    }

    private fun load() {
        lifecycleScope.launch {
            val employee = viewModel.get(employeeId)
            if (employee == null) {
                Toast.makeText(this@DetailActivity, "Сотрудник не найден", Toast.LENGTH_SHORT).show()
                finish()
                return@launch
            }
            binding.lastName.text = employee.lastName
            binding.firstName.text = employee.firstName
            binding.middleName.text = employee.middleName.ifBlank { "—" }
            val path = employee.photoPath
            if (path != null && File(path).exists()) {
                Glide.with(this@DetailActivity).load(File(path)).centerCrop().into(binding.photo)
            } else {
                binding.photo.setImageResource(android.R.drawable.ic_menu_myplaces)
            }
        }
    }

    private fun confirmDelete() {
        AlertDialog.Builder(this)
            .setTitle("Удалить сотрудника?")
            .setMessage(binding.lastName.text.toString() + " " + binding.firstName.text)
            .setPositiveButton("Удалить") { _, _ ->
                viewModel.delete(employeeId) { finish() }
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    companion object {
        const val EXTRA_ID = "id"
    }
}
