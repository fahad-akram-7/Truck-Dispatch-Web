import { supabase } from "./supabaseClient";

export const SOCKET_URL = ""; // Not used for Socket.io anymore, we use Supabase realtime subscriptions instead!

// Helper to get logged-in user profile from User table
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("User").select("*").eq("email", user.email).single();
  return data;
}

export const api = async (path, options = {}) => {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};

  try {
    // 1. POST /auth/register
    if (path === "/auth/register" && method === "POST") {
      const { email, password, fullName, role, licenseNo, phone } = body;
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { fullName, role } }
      });
      if (authError) throw authError;
      if (!authData?.user?.id) {
        throw new Error(
          "Signup succeeded but Supabase returned no user ID. Check email confirmation settings and Supabase client env variables."
        );
      }

      // Upsert into User table (prevent duplicate key errors from trigger)
      const { data: userData, error: userError } = await supabase
        .from("User")
        .upsert({
          id: authData.user.id, // Match the Auth UID!
          fullName,
          email,
          role: role || "CUSTOMER"
        }, { onConflict: "id" })
        .select()
        .single();
      if (userError) throw userError;

      // If Driver, insert into Driver table
      if (role === "DRIVER") {
        const { error: driverError } = await supabase
          .from("Driver")
          .insert({
            userId: userData.id,
            licenseNo: licenseNo || `LIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            phone: phone || "",
            availability: "AVAILABLE",
            currentCity: ""
          });
        if (driverError) throw driverError;
      }
      return { success: true, data: userData };
    }

    // 2. POST /auth/login
    if (path === "/auth/login" && method === "POST") {
      const { email, password } = body;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (authError) throw authError;

      // Retrieve User Profile
      const { data: userProfile, error: profileError } = await supabase
        .from("User")
        .select("*")
        .eq("email", email)
        .single();
      if (profileError) throw profileError;

      return {
        success: true,
        data: {
          accessToken: authData.session.access_token,
          user: userProfile
        }
      };
    }

    // 3. GET /drivers
    if (path === "/drivers" && method === "GET") {
      const { data, error } = await supabase
        .from("Driver")
        .select("*, user:User(*)");
      if (error) throw error;
      return { success: true, data };
    }

    // 4. POST /drivers (Admin create driver)
    if (path === "/drivers" && method === "POST") {
      const { email, password, fullName, phone, licenseNo, currentCity } = body;

      // Sign up the driver user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { fullName, role: "DRIVER" } }
      });
      if (authError) throw authError;
      if (!authData?.user?.id) {
        throw new Error(
          "Signup succeeded but Supabase returned no user ID. Check email confirmation settings and Supabase client env variables."
        );
      }

      // Create User record (using upsert to avoid conflict with the auth trigger)
      const { data: userData, error: userError } = await supabase
        .from("User")
        .upsert({
          id: authData.user.id,
          fullName,
          email,
          role: "DRIVER"
        }, { onConflict: "id" })
        .select()
        .single();
      if (userError) throw userError;

      // Create Driver record
      const { data: driverData, error: driverError } = await supabase
        .from("Driver")
        .insert({
          userId: userData.id,
          licenseNo,
          phone,
          availability: "AVAILABLE",
          currentCity: currentCity || ""
        })
        .select("*, user:User(*)")
        .single();
      if (driverError) throw driverError;

      return { success: true, data: driverData };
    }

    // 5. DELETE /drivers/:id
    if (path.startsWith("/drivers/") && method === "DELETE") {
      const driverId = path.split("/")[2];
      
      // Fetch user profile id for the driver to delete User row too (since User is the parent table)
      const { data: driver } = await supabase.from("Driver").select("userId").eq("id", driverId).single();
      
      const { error } = await supabase.from("Driver").delete().eq("id", driverId);
      if (error) throw error;

      if (driver?.userId) {
        await supabase.from("User").delete().eq("id", driver.userId);
      }
      return { success: true };
    }

    // 6. GET /loads
    if (path === "/loads" && method === "GET") {
      const { data, error } = await supabase
        .from("LoadRequest")
        .select("*, quote:Quote(*), dispatch:Dispatch(*)");
      if (error) throw error;
      return { success: true, data };
    }

    // 7. POST /loads
    if (path === "/loads" && method === "POST") {
      const { data, error } = await supabase
        .from("LoadRequest")
        .insert({
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          origin: body.origin,
          destination: body.destination,
          weightKg: body.weightKg,
          distanceKm: body.distanceKm,
          priority: body.priority || "STANDARD",
          requestedDate: body.requestedDate,
          notes: body.notes || "",
          status: "PENDING"
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    }

    // 8. GET /loads/track/:id
    if (path.startsWith("/loads/track/") && method === "GET") {
      const loadId = path.split("/")[3].split("?")[0];
      // Get the email query parameter from path
      const urlParams = new URLSearchParams(path.split("?")[1] || "");
      const email = urlParams.get("email");

      let query = supabase
        .from("LoadRequest")
        .select("*, quote:Quote(*), dispatch:Dispatch(*, driver:Driver(*, user:User(*)))")
        .eq("id", loadId);

      if (email) {
        query = query.eq("customerEmail", email);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return { success: true, data };
    }

    // 9. POST /quotes/generate/:loadId
    if (path.startsWith("/quotes/generate/") && method === "POST") {
      const loadId = path.split("/")[3];
      const { data: load, error: loadErr } = await supabase
        .from("LoadRequest")
        .select("*")
        .eq("id", loadId)
        .single();
      if (loadErr) throw loadErr;

      const baseCost = load.distanceKm * 2.5;
      const weightCharge = load.weightKg * 0.1;
      const fuelSurcharge = baseCost * 0.15;
      const priorityCharge = load.priority === "EXPRESS" ? 150 : 0;
      const totalAmount = baseCost + weightCharge + fuelSurcharge + priorityCharge;
      const validUntil = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

      const { data: quote, error: quoteErr } = await supabase
        .from("Quote")
        .upsert({
          loadRequestId: loadId,
          baseCost,
          weightCharge,
          fuelSurcharge,
          priorityCharge,
          totalAmount,
          validUntil
        }, { onConflict: "loadRequestId" })
        .select()
        .single();
      if (quoteErr) throw quoteErr;

      // Update LoadRequest status to QUOTED
      await supabase.from("LoadRequest").update({ status: "QUOTED" }).eq("id", loadId);

      return { success: true, data: quote };
    }

    // 10. GET /quotes/:loadId
    if (path.startsWith("/quotes/") && method === "GET" && !path.includes("generate")) {
      const loadId = path.split("/")[2];
      const { data, error } = await supabase
        .from("Quote")
        .select("*")
        .eq("loadRequestId", loadId)
        .single();
      if (error) throw error;
      return { success: true, data };
    }

    // 11. GET /dispatch
    if (path === "/dispatch" && method === "GET") {
      const { data, error } = await supabase
        .from("Dispatch")
        .select("*, driver:Driver(*, user:User(*)), loadRequest:LoadRequest(*)")
        .order("assignedAt", { ascending: false });
      if (error) throw error;
      return { success: true, data };
    }

    // 12. GET /dispatch/my-assignments
    if (path === "/dispatch/my-assignments" && method === "GET") {
      const user = await getCurrentUser();
      if (!user) throw new Error("Unauthorized");

      const { data: driver, error: dErr } = await supabase
        .from("Driver")
        .select("id")
        .eq("userId", user.id)
        .single();
      if (dErr) throw dErr;

      const { data, error } = await supabase
        .from("Dispatch")
        .select("*, loadRequest:LoadRequest(*)")
        .eq("driverId", driver.id)
        .order("assignedAt", { ascending: false });
      if (error) throw error;
      return { success: true, data };
    }

    // 13. POST /dispatch/assign
    if (path === "/dispatch/assign" && method === "POST") {
      const user = await getCurrentUser();
      const assignedById = user ? user.id : null;

      // Find an admin user to fallback to if none logged in
      let assignedId = assignedById;
      if (!assignedId) {
        const { data: adminUser } = await supabase.from("User").select("id").eq("role", "ADMIN").limit(1).single();
        assignedId = adminUser ? adminUser.id : null;
      }

      const { data, error } = await supabase
        .from("Dispatch")
        .upsert({
          loadRequestId: body.loadRequestId,
          driverId: body.driverId,
          assignedById: assignedId,
          currentStatus: "ASSIGNED",
          etaDate: body.etaDate ? new Date(body.etaDate).toISOString() : null
        }, { onConflict: "loadRequestId" })
        .select()
        .single();
      if (error) throw error;

      // Update LoadRequest status
      await supabase.from("LoadRequest").update({ status: "ASSIGNED" }).eq("id", body.loadRequestId);

      return { success: true, data };
    }

    // 14. PUT /dispatch/:id/status
    if (path.startsWith("/dispatch/") && path.endsWith("/status") && method === "PUT") {
      const dispatchId = path.split("/")[2];
      const user = await getCurrentUser();
      const updatedById = user ? user.id : null;

      const { data: dispatch, error: dErr } = await supabase
        .from("Dispatch")
        .select("*")
        .eq("id", dispatchId)
        .single();
      if (dErr) throw dErr;

      // Update Dispatch
      const { data: updatedDispatch, error: uErr } = await supabase
        .from("Dispatch")
        .update({ currentStatus: body.status })
        .eq("id", dispatchId)
        .select()
        .single();
      if (uErr) throw uErr;

      // Update LoadRequest
      await supabase
        .from("LoadRequest")
        .update({ status: body.status })
        .eq("id", dispatch.loadRequestId);

      // Create StatusLog
      let finalUpdatedById = updatedById;
      if (!finalUpdatedById) {
        const { data: defaultUser } = await supabase.from("User").select("id").limit(1).single();
        finalUpdatedById = defaultUser ? defaultUser.id : null;
      }

      await supabase
        .from("StatusLog")
        .insert({
          dispatchId,
          status: body.status,
          note: body.note || "Updated status",
          updatedById: finalUpdatedById
        });

      return { success: true, data: updatedDispatch };
    }

    // 15. GET /dispatch/:id/timeline
    if (path.startsWith("/dispatch/") && path.endsWith("/timeline") && method === "GET") {
      const dispatchId = path.split("/")[2];
      const { data, error } = await supabase
        .from("StatusLog")
        .select("*")
        .eq("dispatchId", dispatchId)
        .order("timestamp", { ascending: true });
      if (error) throw error;
      return { success: true, data };
    }

    throw new Error(`Endpoint mock not implemented: ${path}`);
  } catch (err) {
    console.error("Supabase mock API adapter error: ", err);
    throw new Error(err.message || "Database request failed");
  }
};
