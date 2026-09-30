**The Monday Morning Screen**

*Call Hero Hackathon · 30 September 2026 · UTS Startups*

## **The scene**

It's 8:00am on Monday.

Harbourside Dental closed at 5pm on Friday. Nobody was there all weekend. But the phone kept ringing — 31 calls between Friday evening and Monday morning, and Jade, our AI receptionist, answered every one of them.

Some got booked. Some didn't. A few things went wrong.

The practice owner walks in, coffee in hand. The first patient arrives at 8:30.

**She has ninety seconds.**

## **Your challenge**

Design and build the screen she sees.

**One screen. Ninety seconds. What does she need to know, and what does she need to do about it?**

That's the whole brief.

## **What you're given**

A JSON file: weekend-calls.json

31 real-shaped calls. Caller names, numbers, what they wanted, whether they booked, when they rang, and what Jade flagged.

**It's deliberately messy.** Real weekends are messy. Some of what's in there matters a lot and isn't obvious at first glance.

Read it properly before you start designing. The teams who win this will be the ones who found something in the data that nobody else noticed.

## **The rules Jade operates under**

These aren't footnotes. They're constraints you have to design inside.

**What Jade captures:** name, phone number, what the caller wanted, and whether an appointment was made.

**What Jade never captures:** symptoms, health information, Medicare numbers, or anything clinical. If a caller volunteers something clinical, Jade notes it for the practitioner and moves on. It doesn't get stored as data.

**Recordings:** this clinic has them enabled. Many don't. Your screen has to work either way — don't build something that falls apart when recording\_available is false.

**Who can see this screen:** anyone at the front desk. Assume a patient standing at the counter might glance at it.

Designing well inside real privacy constraints is part of the challenge. A screen that's useful but shows a patient's name and number in 48pt type to the whole waiting room isn't a good screen.

## **What we're judging**

At the end, your screen goes up and we ask you one question:

***“It's Monday, you've got ninety seconds. What do I do first?”***

If your screen answers that, you're in good shape. If it doesn't, no amount of design saves it.

Specifically we're looking at:

**Did you find what matters?**

31 calls. Not all equally important. Which ones did you surface, and which did you bury?

**Can she act on it?**

Knowing something happened isn't useful. Knowing what to do about it is. How fast can she go from looking at your screen to picking up the phone?

**What did you leave out?**

This is the question we care about most. Everything you chose not to show is a decision. Be ready to explain those decisions.

**Does it hold up?**

Does it work on a phone? Does it work when the data is incomplete? Does it work if there are no recordings?

## **Questions worth asking yourself**

* Someone rang three times over the weekend and couldn't get an appointment. Does your screen notice? Should it?

* Two people cancelled. Those slots are now empty. Is that a problem or an opportunity, and does your screen treat it as either?

* One call came in at 2:14am. Does that matter more or less than the others?

* One caller gave a phone number that's a digit short. What happens to them?

* Someone asked about a service the clinic doesn't offer. Is that a dead end or a lead?

* One person said "I'll try somewhere else" and hung up. Does anyone ever find out?

You don't have to answer all of these. But the teams that answer some of them well will stand out.

## **What you can build with**

Use whatever suits your team.

**Build it** — any framework, any AI-assisted tool, anything that produces something we can look at and click.

**Design it** — Figma, or any prototyping tool. A clickable prototype is a completely valid submission if design is your team's strength.

**Pitch it** — if your idea is strong and you can explain it clearly, that counts too. We're judging thinking, not framework choice.

Use AI assistants freely. Tell us how you used them in your reflection — we're genuinely interested, not testing whether you avoided them.

**You do not need to connect to anything real.** No APIs, no phone systems, no databases. The JSON file is all the data you need.

## **Timeline/Agenda**

9:30 am to 10 am \- Registrations.

10:15 am to 10:30 am \- Presentation about the challenge 

10:30 am to 11:00 am \- Google Classroom and joining

11:00 am to 2:00 pm \- Students finish project and submit presentation recording on Google Classroom 

2:00 pm to 2:45 pm \- Lunch \+ Networking \+ interviews 

2:45pm to 3:30 pm \- Students presentations in front 

3:30 pm to 3:50 pm \- Top 3 winners announced

## **Presenting**

**Five minutes.** Show us the screen — live, in front of the room, 2:45–3:30pm.

Walk us through it as if you're the practice owner on Monday morning. Then we'll ask:

1. What did you find in the data that you didn't expect?

2. What did you deliberately leave off the screen, and why?

3. What would you build next with another day?

Individual marks come from this live presentation — make sure everyone on the team speaks and can field a question.

## **What to submit**

One submission per team, due by 2:00pm, uploaded to Google Classroom.

* A recording of your presentation

* A link to your screen, or your Figma prototype, or your files

* Three or four sentences: what you built and what you decided to prioritise

## **One last thing**

We'd rather see one screen that genuinely works than five that look impressive and don't.

If you're running out of time at 1:30pm, cut scope. Ship something real. That decision — knowing what to drop — is one of the things we'll notice most.

**Good luck.**