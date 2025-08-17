import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client, S3_BUCKET_NAME } from "@/lib/aws";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("DELETE /api/mixes/[id]: Starting delete request");

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("DELETE /api/mixes/[id]: Session check completed", {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });

    if (!session?.user) {
      console.log(
        "DELETE /api/mixes/[id]: No session found - user not authenticated"
      );
      return NextResponse.json(
        { ok: false, error: "Unauthorized - Please log in to delete mixes" },
        { status: 401 }
      );
    }

    const { id: mixId } = await params;
    console.log(
      `DELETE /api/mixes/${mixId}: User ${session.user.id} attempting to delete`
    );

    // Get the mix to check ownership and get S3 key
    const mix = await prisma.djMix.findUnique({
      where: { id: mixId },
      include: {
        dj: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!mix) {
      console.log(`DELETE /api/mixes/${mixId}: Mix not found`);
      return NextResponse.json(
        { ok: false, error: "Mix not found" },
        { status: 404 }
      );
    }

    console.log(
      `DELETE /api/mixes/${mixId}: Mix found, owner: ${mix.dj.user.id}, user: ${session.user.id}, user role: ${session.user.role}`
    );

    // Check if user owns the mix or is an admin
    const isOwner = mix.dj.user.id === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const canDelete = isOwner || isAdmin;

    console.log(
      `DELETE /api/mixes/${mixId}: Authorization check - isOwner: ${isOwner}, isAdmin: ${isAdmin}, canDelete: ${canDelete}`
    );
    console.log(
      `DELETE /api/mixes/${mixId}: ID comparison - mix.dj.user.id: "${
        mix.dj.user.id
      }" (type: ${typeof mix.dj.user.id}), session.user.id: "${
        session.user.id
      }" (type: ${typeof session.user.id})`
    );

    if (!canDelete) {
      console.log(
        `DELETE /api/mixes/${mixId}: Access denied - user doesn't own mix and is not admin`
      );
      return NextResponse.json(
        { ok: false, error: "Forbidden - You can only delete your own mixes" },
        { status: 403 }
      );
    }

    console.log(
      `DELETE /api/mixes/${mixId}: Authorization successful, proceeding with deletion`
    );

    // Delete from S3
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: mix.s3Key,
      });

      await s3Client.send(deleteCommand);
      console.log(`Deleted file from S3: ${mix.s3Key}`);
    } catch (s3Error) {
      console.error("Error deleting from S3:", s3Error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await prisma.djMix.delete({
      where: { id: mixId },
    });

    console.log(
      `DELETE /api/mixes/${mixId}: Successfully deleted from database`
    );
    return NextResponse.json({ ok: true, message: "Mix deleted successfully" });
  } catch (error) {
    console.error("Error deleting mix:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete mix" },
      { status: 500 }
    );
  }
}
