export async function UpdateOrCreate(
  Model: any,
  key: { [key: string]: any },
  data: any,
) {
  try {
    console.log({ key });
    const exists = await Model.findOne(key);

    if (exists) {
      const msg = `${JSON.stringify(key)} already exists updating...`;
      console.log(msg);
      await Model.findByIdAndUpdate(exists._id, data);
      return { result: true, msg };
    }
    const msg = `${JSON.stringify(key)} doenst exists creating...`;
    console.log(msg);

    const newOne = new Model(data);
    newOne.save();
    return { result: true, msg };
  } catch (err) {
    console.log("UPDATE OF CREATE ERROR:", err);
    return { result: false, msg: `DB error: ${err}` };
  }
}
