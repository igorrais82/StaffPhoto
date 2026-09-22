export type Employee = {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeInput = {
  lastName: string;
  firstName: string;
  middleName: string;
  photoUri: string | null;
};
