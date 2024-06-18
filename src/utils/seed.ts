import bcrypt from "bcrypt";

import User from "../entities/User";
import { ProjectModel, UserModel } from "../mongoose/mongodb";
import { UpdateOrCreate } from "../mongoose/utils";
import Project from "../entities/Project";

async function main() {
  // mongoose.connection.collections["payments"].drop();

  const hash_pass = await bcrypt.hash("Lamarcagatao@123", 10);
  const hash_token = await bcrypt.hash(
    "lamarcadigitalart@gmail.com@Lamarcagatao@123",
    10,
  );
  const project_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  const user_id = "cccccccc-cccc-cccc-cccc-ccccccccc";

  const users: User[] = [
    new User(user_id, "lamarcadigitalart@gmail.com", hash_pass, hash_token, 3),
  ];

  const projects: Project[] = [
    new Project(
      project_id,
      "projeto de teste",
      "Primeiro projeto criado pelo servidor para testar",
    ),
  ];

  await UpdateOrCreate(UserModel, { id: users[0].id }, users[0]);
  await UpdateOrCreate(
    ProjectModel,
    { project_id: projects[0].project_id },
    projects[0],
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
