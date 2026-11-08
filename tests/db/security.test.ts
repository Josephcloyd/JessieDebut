import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { ADMIN_ID, OUTSIDER_ID, createTestDatabase, queryAs } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createTestDatabase();
});

describe("anonymous visitors", () => {
  it("are refused guest, RSVP and upload records", async () => {
    for (const table of ["guests", "rsvps", "guest_uploads", "admin_users", "rate_limits"]) {
      await expect(queryAs(db, "anon", `select * from public.${table}`)).rejects.toThrow(/permission denied/);
    }
  });

  it("see only the published settings row", async () => {
    const rows = await queryAs<{ state: string }>(db, "anon", "select state from public.event_settings");
    expect(rows).toEqual([{ state: "published" }]);
  });

  it("cannot write to any public content table", async () => {
    await expect(
      queryAs(db, "anon", "update public.site_controls set rsvp_open = false"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      queryAs(db, "anon", "insert into public.guest_messages (guest_name, message, status) values ('x','y','approved')"),
    ).rejects.toThrow(/permission denied/);
  });

  it("cannot call server-only functions", async () => {
    await expect(
      queryAs(db, "anon", "select public.submit_rsvp('ABCD2345','A',null,null,'attending',0,'','')"),
    ).rejects.toThrow(/permission denied/);
    await expect(queryAs(db, "anon", "select public.check_rate_limit('k',1,1)")).rejects.toThrow(/permission denied/);
  });

  it("see approved wishes without the linked guest id", async () => {
    await db.exec(`
      insert into public.guest_messages (guest_name, message, status) values
        ('Approved', 'Shown', 'approved'), ('Waiting', 'Hidden', 'pending'), ('Rejected', 'Hidden', 'rejected');
    `);
    const rows = await queryAs<{ guest_name: string }>(db, "anon", "select guest_name from public.guest_messages");
    expect(rows).toEqual([{ guest_name: "Approved" }]);
    await expect(queryAs(db, "anon", "select guest_id from public.guest_messages")).rejects.toThrow(/permission denied/);
  });

  it("can run the exact wish query the public site uses", async () => {
    const rows = await queryAs<{ guest_name: string }>(
      db,
      "anon",
      "select id, guest_name, message, is_featured, created_at from public.guest_messages order by is_featured desc, created_at desc limit 120",
    );
    expect(rows.map((row) => row.guest_name)).toEqual(["Approved"]);
  });

  it("cannot filter wishes by review status", async () => {
    await expect(
      queryAs(db, "anon", "select guest_name from public.guest_messages where status = 'pending'"),
    ).rejects.toThrow(/permission denied/);
  });

  it("cannot see photos from guest-only or hidden albums, or hidden photos", async () => {
    await db.exec(`
      insert into public.gallery_albums (id, name, visibility) values
        ('20000000-0000-0000-0000-000000000001', 'Open', 'public'),
        ('20000000-0000-0000-0000-000000000002', 'Private', 'guests');
      insert into public.gallery_photos (album_id, storage_path, caption, is_visible) values
        ('20000000-0000-0000-0000-000000000001', 'a', 'visible', true),
        ('20000000-0000-0000-0000-000000000001', 'b', 'switched off', false),
        ('20000000-0000-0000-0000-000000000002', 'c', 'private', true);
    `);
    const photos = await queryAs<{ caption: string }>(db, "anon", "select caption from public.gallery_photos");
    expect(photos).toEqual([{ caption: "visible" }]);
    const albums = await queryAs<{ name: string }>(db, "anon", "select name from public.gallery_albums where name = 'Private'");
    expect(albums).toEqual([]);
  });
});

describe("signed-in users who are not admins", () => {
  it("get no guest data and no draft settings", async () => {
    expect(await queryAs(db, "authenticated", "select * from public.guests", [], OUTSIDER_ID)).toEqual([]);
    const states = await queryAs<{ state: string }>(db, "authenticated", "select state from public.event_settings", [], OUTSIDER_ID);
    expect(states).toEqual([{ state: "published" }]);
  });

  it("cannot publish, reorder or read stats", async () => {
    await expect(queryAs(db, "authenticated", "select public.publish_event_settings()", [], OUTSIDER_ID)).rejects.toThrow(/Not authorized/);
    await expect(queryAs(db, "authenticated", "select public.reorder_items('event_program', '{}')", [], OUTSIDER_ID)).rejects.toThrow(/Not authorized/);
    await expect(queryAs(db, "authenticated", "select public.admin_stats()", [], OUTSIDER_ID)).rejects.toThrow(/Not authorized/);
  });

  it("cannot make themselves an admin", async () => {
    await expect(
      queryAs(db, "authenticated", `insert into public.admin_users (user_id) values ('${OUTSIDER_ID}')`, [], OUTSIDER_ID),
    ).rejects.toThrow();
  });
});

describe("admins", () => {
  it("can read guests and draft settings", async () => {
    const guests = await queryAs(db, "authenticated", "select * from public.guests", [], ADMIN_ID);
    expect(guests).toHaveLength(1);
    const states = await queryAs(db, "authenticated", "select state from public.event_settings order by state", [], ADMIN_ID);
    expect(states).toHaveLength(2);
  });

  it("publish copies the draft to guests and clears the unpublished flag", async () => {
    await queryAs(db, "authenticated", "update public.event_settings set venue_name = 'The Manor' where state = 'draft'", [], ADMIN_ID);
    const before = await queryAs<{ venue_name: string }>(db, "anon", "select venue_name from public.event_settings");
    expect(before[0].venue_name).not.toBe("The Manor");

    await queryAs(db, "authenticated", "select public.publish_event_settings()", [], ADMIN_ID);

    const after = await queryAs<{ venue_name: string }>(db, "anon", "select venue_name from public.event_settings");
    expect(after[0].venue_name).toBe("The Manor");
    const [controls] = await queryAs<{ has_unpublished_changes: boolean }>(db, "anon", "select has_unpublished_changes from public.site_controls");
    expect(controls.has_unpublished_changes).toBe(false);
  });

  it("reorder rejects tables outside the allow list", async () => {
    await expect(queryAs(db, "authenticated", "select public.reorder_items('guests', '{}')", [], ADMIN_ID)).rejects.toThrow(/Unsupported table/);
  });

  it("reorder applies the given sequence", async () => {
    const programme = await db.query<{ id: string }>("select id from public.event_program order by sort_order");
    const reversed = programme.rows.map((row) => row.id).reverse();
    await queryAs(db, "authenticated", "select public.reorder_items('event_program', $1::uuid[])", [reversed], ADMIN_ID);
    const result = await db.query<{ id: string }>("select id from public.event_program order by sort_order");
    expect(result.rows.map((row) => row.id)).toEqual(reversed);
  });
});

describe("submit_rsvp", () => {
  const submit = (code: string, status: string, companions: number) =>
    queryAs<{ result: string }>(
      db,
      "service_role",
      "select public.submit_rsvp($1,'Ana Reyes',null,null,$2,$3,'','') as result",
      [code, status, companions],
    ).then((rows) => rows[0].result);

  it("rejects an unknown code", async () => {
    expect(await submit("ZZZZ9999", "attending", 0)).toBe("unknown_code");
  });

  it("rejects more companions than the allowance", async () => {
    expect(await submit("ABCD2345", "attending", 3)).toBe("over_allowance");
  });

  it("accepts lowercase codes and keeps a single row on resubmission", async () => {
    expect(await submit("abcd2345", "attending", 2)).toBe("ok");
    expect(await submit("ABCD2345", "attending", 1)).toBe("ok");
    const rows = await db.query<{ companions: number }>("select companions from public.rsvps");
    expect(rows.rows).toEqual([{ companions: 1 }]);
  });

  it("zeroes companions when a guest declines", async () => {
    expect(await submit("ABCD2345", "declined", 2)).toBe("ok");
    const rows = await db.query<{ status: string; companions: number }>("select status, companions from public.rsvps");
    expect(rows.rows).toEqual([{ status: "declined", companions: 0 }]);
  });

  it("refuses submissions while RSVPs are closed", async () => {
    await db.exec("update public.site_controls set rsvp_open = false");
    expect(await submit("ABCD2345", "attending", 0)).toBe("closed");
    await db.exec("update public.site_controls set rsvp_open = true");
  });
});

describe("check_rate_limit", () => {
  it("blocks calls past the limit within the window", async () => {
    const hit = () =>
      queryAs<{ allowed: boolean }>(db, "service_role", "select public.check_rate_limit('ip:1', 2, 60) as allowed").then(
        (rows) => rows[0].allowed,
      );
    expect(await hit()).toBe(true);
    expect(await hit()).toBe(true);
    expect(await hit()).toBe(false);
  });

  it("starts a new window once the old one expires", async () => {
    await db.exec(`insert into public.rate_limits (key, window_start, hits) values ('ip:2', now() - interval '2 minutes', 99)`);
    const rows = await queryAs<{ allowed: boolean }>(db, "service_role", "select public.check_rate_limit('ip:2', 2, 60) as allowed");
    expect(rows[0].allowed).toBe(true);
  });
});
