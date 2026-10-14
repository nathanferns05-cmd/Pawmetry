export type Species =
  | "Dog"
  | "Cat"
  | "Bird"
  | "Rabbit"
  | "Other";

export type Gender =
  | "Male"
  | "Female";

export interface Pet {
  petName: string;
  species: Species;
  breed: string;
  gender: Gender;
  dob: string;
  weight: string;
  color: string;
  vaccinated: boolean;
  microchipped: boolean;
  photo: string;
}