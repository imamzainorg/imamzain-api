// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Starting database seed...");

	// 1) Define roles
	const roleNames = ["SUPER_ADMIN", "ADMIN", "EDITOR", "USER"];
	const roleMap: Record<string, number> = {};
	
	for (const name of roleNames) {
		const role = await prisma.role.upsert({
			where: { name },
			update: {},
			create: {
				name,
				description: name.replace(/_/g, " ").toLowerCase(),
			},
		});
		roleMap[name] = role.id;
		console.log(`✅ Role created/updated: ${name}`);
	}

	// 2) Define models based on your actual Prisma schema
	const models = [
		// Auth & ACL Models
		"USER",
		"ACTIVITYLOG",
		"ROLE",
		"PERMISSION",
		"USERROLE",
		"GROUP",
		"GROUPMEMBER",
		"ROLEPERMISSION",
		"GROUPPERMISSION",
		"REFRESHTOKEN",
		
		// Language System
		"LANGUAGE",
		
		// Attachments System
		"ATTACHMENTS",
		
		// Tags System
		"TAG",
		"TAGTRANSLATION",
		"ARTICLETAG",
		"RESEARCHTAG",
		"BOOKTAG",
		
		// Category System
		"CATEGORY",
		"CATEGORYTRANSLATION",
		
		// Article System
		"ARTICLE",
		"ARTICLETRANSLATION",
		"ARTICLEATTACHMENTS",
		
		// Research System
		"RESEARCH",
		"RESEARCHTRANSLATION",
		"RESEARCHATTACHMENTS",
		
		// Book System
		"BOOK",
		"BOOKTRANSLATION",
		"BOOKATTACHMENTS"
	];

	const actions = ["CREATE", "READ", "UPDATE", "DELETE"];

	// 3) Generate and upsert permissions
	const permissionMap: Record<string, number> = {};
	
	for (const model of models) {
		for (const action of actions) {
			const name = `${action}_${model}`;
			const description = `${action.toLowerCase()} ${model.toLowerCase()}`;
			
			const perm = await prisma.permission.upsert({
				where: { name },
				update: { description },
				create: { name, description },
			});
			permissionMap[name] = perm.id;
		}
	}

	console.log(`✅ Created/updated ${Object.keys(permissionMap).length} permissions`);

	// 4) Assign all permissions to SUPER_ADMIN
	const superAdminId = roleMap["SUPER_ADMIN"];
	let superAdminPermissions = 0;
	
	for (const permissionId of Object.values(permissionMap)) {
		await prisma.rolePermission.upsert({
			where: {
				roleId_permissionId: { roleId: superAdminId, permissionId },
			},
			update: {},
			create: { roleId: superAdminId, permissionId },
		});
		superAdminPermissions++;
	}
	
	console.log(`✅ Assigned ${superAdminPermissions} permissions to SUPER_ADMIN`);

	// 5) Assign READ permissions to USER role
	const userRoleId = roleMap["USER"];
	let userPermissions = 0;
	
	for (const [key, permissionId] of Object.entries(permissionMap)) {
		if (key.startsWith("READ_")) {
			await prisma.rolePermission.upsert({
				where: {
					roleId_permissionId: { roleId: userRoleId, permissionId },
				},
				update: {},
				create: { roleId: userRoleId, permissionId },
			});
			userPermissions++;
		}
	}
	
	console.log(`✅ Assigned ${userPermissions} READ permissions to USER`);

	// 6) Assign content management permissions to EDITOR
	const editorRoleId = roleMap["EDITOR"];
	const editorPermissions = [
		// Article permissions
		"CREATE_ARTICLE", "READ_ARTICLE", "UPDATE_ARTICLE", "DELETE_ARTICLE",
		"CREATE_ARTICLETRANSLATION", "READ_ARTICLETRANSLATION", "UPDATE_ARTICLETRANSLATION", "DELETE_ARTICLETRANSLATION",
		"CREATE_ARTICLEATTACHMENTS", "READ_ARTICLEATTACHMENTS", "UPDATE_ARTICLEATTACHMENTS", "DELETE_ARTICLEATTACHMENTS",
		"CREATE_ARTICLETAG", "READ_ARTICLETAG", "UPDATE_ARTICLETAG", "DELETE_ARTICLETAG",
		
		// Book permissions
		"CREATE_BOOK", "READ_BOOK", "UPDATE_BOOK", "DELETE_BOOK",
		"CREATE_BOOKTRANSLATION", "READ_BOOKTRANSLATION", "UPDATE_BOOKTRANSLATION", "DELETE_BOOKTRANSLATION",
		"CREATE_BOOKATTACHMENTS", "READ_BOOKATTACHMENTS", "UPDATE_BOOKATTACHMENTS", "DELETE_BOOKATTACHMENTS",
		"CREATE_BOOKTAG", "READ_BOOKTAG", "UPDATE_BOOKTAG", "DELETE_BOOKTAG",
		
		// Research permissions
		"CREATE_RESEARCH", "READ_RESEARCH", "UPDATE_RESEARCH", "DELETE_RESEARCH",
		"CREATE_RESEARCHTRANSLATION", "READ_RESEARCHTRANSLATION", "UPDATE_RESEARCHTRANSLATION", "DELETE_RESEARCHTRANSLATION",
		"CREATE_RESEARCHATTACHMENTS", "READ_RESEARCHATTACHMENTS", "UPDATE_RESEARCHATTACHMENTS", "DELETE_RESEARCHATTACHMENTS",
		"CREATE_RESEARCHTAG", "READ_RESEARCHTAG", "UPDATE_RESEARCHTAG", "DELETE_RESEARCHTAG",
		
		// Category permissions
		"CREATE_CATEGORY", "READ_CATEGORY", "UPDATE_CATEGORY", "DELETE_CATEGORY",
		"CREATE_CATEGORYTRANSLATION", "READ_CATEGORYTRANSLATION", "UPDATE_CATEGORYTRANSLATION", "DELETE_CATEGORYTRANSLATION",
		
		// Tag permissions
		"CREATE_TAG", "READ_TAG", "UPDATE_TAG", "DELETE_TAG",
		"CREATE_TAGTRANSLATION", "READ_TAGTRANSLATION", "UPDATE_TAGTRANSLATION", "DELETE_TAGTRANSLATION",
		
		// Attachment permissions
		"CREATE_ATTACHMENTS", "READ_ATTACHMENTS", "UPDATE_ATTACHMENTS", "DELETE_ATTACHMENTS",
		
		// Language permissions
		"READ_LANGUAGE"
	];

	let assignedEditorPermissions = 0;
	for (const permissionName of editorPermissions) {
		const permissionId = permissionMap[permissionName];
		if (permissionId) {
			await prisma.rolePermission.upsert({
				where: {
					roleId_permissionId: { roleId: editorRoleId, permissionId },
				},
				update: {},
				create: { roleId: editorRoleId, permissionId },
			});
			assignedEditorPermissions++;
		}
	}
	
	console.log(`✅ Assigned ${assignedEditorPermissions} permissions to EDITOR`);

	// 7) Seed Languages
	const languages = [
		{
			code: "ar",
			name: "Arabic",
			nativeName: "العربية",
			isActive: true
		},
		{
			code: "en",
			name: "English",
			nativeName: "English",
			isActive: true
		},
		{
			code: "fa",
			name: "Persian",
			nativeName: "الفارسية",
			isActive: true
		},
		{
			code: "ur",
			name: "Urdu",
			nativeName: "اردو",
			isActive: true
		}
	];

	for (const lang of languages) {
		await prisma.language.upsert({
			where: { code: lang.code },
			update: {
				name: lang.name,
				nativeName: lang.nativeName,
				isActive: lang.isActive
			},
			create: lang,
		});
	}
	
	console.log(`✅ Created/updated ${languages.length} languages`);

	// 8) Seed SUPER_ADMIN user
	const username = process.env.SUPER_ADMIN_USERNAME || "superadmin";
	const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@example.com";
	const password = process.env.SUPER_ADMIN_PASSWORD || "q1w2e3r4@";
	const fullName = process.env.SUPER_ADMIN_FULLNAME || "Super Administrator";
	
	console.log(`🔐 Creating SUPER_ADMIN user with username: ${username}`);
	
	const passwordHash = await bcrypt.hash(password, 12);
	
	const user = await prisma.user.upsert({
		where: { username },
		update: { 
			passwordHash, 
			email,
			fullName,
			isActive: true 
		},
		create: {
			username,
			email,
			fullName,
			passwordHash,
			isActive: true,
			roles: { 
				create: { 
					roleId: superAdminId 
				} 
			},
		},
	});
	
	console.log(`✅ SUPER_ADMIN user created/updated with ID: ${user.id}`);

	// 9) Verify the user and password
	console.log("\n🧪 Verifying user credentials...");
	const testUser = await prisma.user.findUnique({
		where: { username },
		include: { roles: { include: { role: true } } }
	});
	
	if (testUser) {
		const isPasswordValid = await bcrypt.compare(password, testUser.passwordHash);
		console.log(`✅ User exists: ${testUser.username}`);
		console.log(`✅ User active: ${testUser.isActive}`);
		console.log(`✅ Password valid: ${isPasswordValid}`);
		console.log(`✅ User roles: ${testUser.roles.map(r => r.role.name).join(", ")}`);
		
		if (isPasswordValid && testUser.isActive) {
			console.log("\n🎉 SUCCESS! You can now login with:");
			console.log(`   Username: ${username}`);
			console.log(`   Password: ${password}`);
		}
	}

	console.log("\n✅ Seed completed successfully!");
}

main()
	.catch((e) => {
		console.error("❌ Seeder error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});