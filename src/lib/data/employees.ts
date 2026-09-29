/** Initial employee directory used when the database has not been set up yet. */
export const EMPLOYEES_SEED = [
  { id: "EMP-001", name: "Sarah Mitchell", address: "12 Elm Street", city: "Birmingham", contactNumber: "+44 121 456 7890", email: "sarah.m@wildtouch.co.uk" },
  { id: "EMP-002", name: "Tom Bradley", address: "7 Oak Avenue", city: "Manchester", contactNumber: "+44 161 234 5678", email: "t.bradley@wildtouch.co.uk" },
  { id: "EMP-003", name: "Aisha Patel", address: "3 Rose Lane", city: "London", contactNumber: "+44 207 889 0011", email: "a.patel@wildtouch.co.uk" },
  { id: "EMP-004", name: "Kevin Shaw", address: "29 Birch Road", city: "Leeds", contactNumber: "+44 113 667 4422", email: "k.shaw@wildtouch.co.uk" },
  { id: "EMP-005", name: "Emma Ford", address: "18 Maple Close", city: "Bristol", contactNumber: "+44 117 554 9988", email: "e.ford@wildtouch.co.uk" },
] as const;

/** Fallback suggestions for screens that have not loaded the employee API yet. */
export const EMPLOYEE_NAMES = EMPLOYEES_SEED.map((employee) => employee.name);
