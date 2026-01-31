/**
 * Search utility functions for client-side data filtering
 */

export const searchByName = <T>(
  data: T[],
  query: string,
  getNameFields: (item: T) => string[]
): T[] => {
  const q = query.trim().toLowerCase();

  if (!q) {
    return data;
  }

  return data.filter((item) => {
    const nameFields = getNameFields(item);
    return nameFields.some((name) => {
      if (typeof name === "string") {
        return name.toLowerCase().includes(q);
      }
      return false;
    });
  });
};

export const searchStudentsByName = <T extends { firstName?: string; lastName?: string }>(
  data: T[],
  query: string
): T[] => {
  return searchByName(data, query, (student) => [
    student.firstName || "",
    student.lastName || "",
    `${student.firstName || ""} ${student.lastName || ""}`,
  ]);
};

export const searchTeachersByName = <T extends { firstName?: string; lastName?: string }>(
  data: T[],
  query: string
): T[] => {
  return searchByName(data, query, (teacher) => [
    teacher.firstName || "",
    teacher.lastName || "",
    `${teacher.firstName || ""} ${teacher.lastName || ""}`,
  ]);
};

export const searchTransportByName = <T extends {
  vehicleNumber?: string;
  driverFirstName?: string;
  driverLastName?: string;
  conductorFirstName?: string;
  conductorLastName?: string;
}>(
  data: T[],
  query: string
): T[] => {
  return searchByName(data, query, (transport) => [
    transport.vehicleNumber || "",
    transport.driverFirstName || "",
    transport.driverLastName || "",
    `${transport.driverFirstName || ""} ${transport.driverLastName || ""}`,
    transport.conductorFirstName || "",
    transport.conductorLastName || "",
    `${transport.conductorFirstName || ""} ${transport.conductorLastName || ""}`,
  ]);
};

export const searchInventoryByName = <T extends { itemName?: string }>(
  data: T[],
  query: string
): T[] => {
  return searchByName(data, query, (item) => [item.itemName || ""]);
};

