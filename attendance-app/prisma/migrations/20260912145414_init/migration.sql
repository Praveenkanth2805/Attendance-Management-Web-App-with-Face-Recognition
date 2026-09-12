-- CreateTable
CREATE TABLE "classes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "years" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "students" (
    "register_number" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "class_id" INTEGER NOT NULL,
    "year_id" INTEGER NOT NULL,
    "face_encoding" TEXT,
    CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "register_number" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "check_in_time" TEXT NOT NULL,
    CONSTRAINT "attendance_register_number_fkey" FOREIGN KEY ("register_number") REFERENCES "students" ("register_number") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_key" ON "classes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "years_name_key" ON "years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_register_number_date_key" ON "attendance"("register_number", "date");
