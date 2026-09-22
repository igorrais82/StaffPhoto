package com.staffphoto.app

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.staffphoto.app.data.Employee
import com.staffphoto.app.databinding.ItemEmployeeBinding
import java.io.File

class EmployeeAdapter(
    private val onClick: (Employee) -> Unit,
) : ListAdapter<Employee, EmployeeAdapter.Holder>(Diff) {

    object Diff : DiffUtil.ItemCallback<Employee>() {
        override fun areItemsTheSame(oldItem: Employee, newItem: Employee) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Employee, newItem: Employee) = oldItem == newItem
    }

    class Holder(val binding: ItemEmployeeBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val binding = ItemEmployeeBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return Holder(binding)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val employee = getItem(position)
        holder.binding.name.text = employee.fullName()
        val path = employee.photoPath
        if (path != null && File(path).exists()) {
            Glide.with(holder.binding.photo).load(File(path)).centerCrop().into(holder.binding.photo)
        } else {
            holder.binding.photo.setImageResource(android.R.drawable.ic_menu_myplaces)
        }
        holder.binding.root.setOnClickListener { onClick(employee) }
    }
}
