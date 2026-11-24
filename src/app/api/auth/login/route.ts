import { generateJwt } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/types/api.types";
import { LoginBody } from "@/types/user.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
    await connectDB();
    const body: LoginBody = await req.json();

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

    const isExisted = await UserModel.findOne({ email });

    if (isExisted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 409,
        }
      );
    }
        let matchPass = isExisted.comparePass(password)
        
        if (!matchPass)
            return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Invalid password",
        },
        {
          status: 401,
        }
      );
    }
  

    const token = generateJwt({ userId: isExisted._id.toString() });

    const response = NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "User created successfully",
        data: {
          user: {
            id: isExisted._id,
            name: isExisted.name,
            email: isExisted.email,
            mobile: isExisted.mobile,
          },
          token,
        },
      },
      {
        status: 201,
      }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    console.log("error in register api", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Failed to create user",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }

 