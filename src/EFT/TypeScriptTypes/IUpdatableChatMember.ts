import { IUpdatableChatMemberInfo } from "./IUpdatableChatMemberInfo";

export interface UpdatableChatMember {
    id: string;
    info: IUpdatableChatMemberInfo;
    hasNickname: boolean;
    localizedNickname: string;
}