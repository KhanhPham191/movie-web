import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Shield, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Truy cập bị hạn chế | MovPey",
  description: "Trang web này chỉ dành cho người dùng tại Việt Nam",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 px-4 py-12">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Truy cập bị hạn chế
          </CardTitle>
          <CardDescription className="text-base">
            Rất tiếc, trang web này chỉ dành cho người dùng tại Việt Nam
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Vị trí địa lý không được phép
                </p>
                <p>
                  Dựa trên địa chỉ IP của bạn, chúng tôi phát hiện bạn đang truy cập từ bên ngoài Việt Nam.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-yellow-500" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Lý do hạn chế
                </p>
                <p>
                  Để đảm bảo tuân thủ các quy định pháp luật và bản quyền, dịch vụ của chúng tôi chỉ khả dụng tại Việt Nam.
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Nếu bạn đang ở Việt Nam nhưng vẫn thấy thông báo này, vui lòng liên hệ với chúng tôi để được hỗ trợ.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



