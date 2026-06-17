# Database Schema

## users

| Column | Type |
|---|---|
| id 🔑 | integer |
| username | varchar |
| first_name | varchar |
| last_name | varchar |
| phone_number | varchar |
| email | varchar |
| profile_image | varchar |
| password | varchar |
| address | varchar |
| insurance_id | varchar |
| role | varchar |
| created_at | timestamp |

---

## hospitals

| Column | Type |
|---|---|
| id 🔑 | integer |
| hospital_name | varchar |

---

## schedules

| Column | Type | Constraints |
|---|---|---|
| id 🔑 | integer | |
| hospital_id 🔗 | integer | NN |
| available_period | timestamp | |
| max_capacity | integer | |
| current_booked | integer | |
| is_full | boolean | |

> `hospital_id` references `hospitals.id`

---

## reserves

| Column | Type | Constraints |
|---|---|---|
| id 🔑 | integer | |
| booking_code | varchar | NN, unique |
| user_id 🔗 | integer | NN |
| hospital_id 🔗 | integer | NN |
| schedule_id 🔗 | integer | NN |
| purpose | varchar | |
| status | varchar | |
| created_at | timestamp | |
| queue_number | varchar | |
| current_station_id 🔗 | integer | |
| queue_updated_at | timestamp | |

> `user_id` references `users.id`
> `hospital_id` references `hospitals.id`
> `schedule_id` references `schedules.id`

---

## Relationships

- `schedules.hospital_id` → `hospitals.id`
- `reserves.user_id` → `users.id`
- `reserves.hospital_id` → `hospitals.id`
- `reserves.schedule_id` → `schedules.id`
