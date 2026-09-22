package com.staffphoto.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.staffphoto.app.databinding.ActivityFormBinding
import kotlinx.coroutines.launch
import java.io.File

class FormActivity : AppCompatActivity() {
    private lateinit var binding: ActivityFormBinding
    private val viewModel: EmployeeViewModel by viewModels()
    private var employeeId: Long? = null
    private var existingPhotoPath: String? = null
    private var selectedUri: Uri? = null
    private var clearPhoto = false
    private var cameraUri: Uri? = null

    private val galleryLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            selectedUri = uri
            clearPhoto = false
            showPreview(uri)
        }
    }

    private val cameraLauncher = registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        if (ok && cameraUri != null) {
            selectedUri = cameraUri
            clearPhoto = false
            showPreview(cameraUri!!)
        }
    }

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) launchCamera() else Toast.makeText(this, "Нужен доступ к камере", Toast.LENGTH_SHORT).show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityFormBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val id = intent.getLongExtra(EXTRA_ID, -1)
        employeeId = id.takeIf { it > 0 }

        binding.toolbar.title = if (employeeId == null) "Новый сотрудник" else "Редактирование"
        binding.toolbar.setNavigationOnClickListener { finish() }
        binding.toolbar.setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
        binding.saveButton.text = if (employeeId == null) "Создать" else "Сохранить"

        binding.galleryButton.setOnClickListener { galleryLauncher.launch("image/*") }
        binding.cameraButton.setOnClickListener {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                launchCamera()
            } else {
                permissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
        binding.clearPhotoButton.setOnClickListener {
            selectedUri = null
            clearPhoto = true
            binding.photo.setImageResource(android.R.drawable.ic_menu_camera)
        }
        binding.photo.setOnClickListener { galleryLauncher.launch("image/*") }
        binding.saveButton.setOnClickListener { save() }

        if (employeeId != null) {
            lifecycleScope.launch {
                val employee = viewModel.get(employeeId!!) ?: return@launch
                binding.lastNameInput.setText(employee.lastName)
                binding.firstNameInput.setText(employee.firstName)
                binding.middleNameInput.setText(employee.middleName)
                existingPhotoPath = employee.photoPath
                if (existingPhotoPath != null && File(existingPhotoPath!!).exists()) {
                    Glide.with(this@FormActivity).load(File(existingPhotoPath!!)).centerCrop().into(binding.photo)
                }
            }
        }
    }

    private fun launchCamera() {
        val dir = File(cacheDir, "camera").also { it.mkdirs() }
        val file = File(dir, "capture_${System.currentTimeMillis()}.jpg")
        cameraUri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        cameraLauncher.launch(cameraUri!!)
    }

    private fun showPreview(uri: Uri) {
        Glide.with(this).load(uri).centerCrop().into(binding.photo)
    }

    private fun save() {
        val lastName = binding.lastNameInput.text?.toString().orEmpty()
        val firstName = binding.firstNameInput.text?.toString().orEmpty()
        val middleName = binding.middleNameInput.text?.toString().orEmpty()
        if (lastName.isBlank() || firstName.isBlank()) {
            Toast.makeText(this, "Укажите фамилию и имя", Toast.LENGTH_SHORT).show()
            return
        }
        viewModel.save(
            id = employeeId,
            lastName = lastName,
            firstName = firstName,
            middleName = middleName,
            photoUri = selectedUri,
            clearPhoto = clearPhoto,
        ) { savedId ->
            startActivity(
                Intent(this, DetailActivity::class.java)
                    .putExtra(DetailActivity.EXTRA_ID, savedId)
                    .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP),
            )
            finish()
        }
    }

    companion object {
        const val EXTRA_ID = "id"
    }
}
