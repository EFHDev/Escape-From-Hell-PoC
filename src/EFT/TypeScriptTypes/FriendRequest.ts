import { UpdatableChatMember } from "./IUpdatableChatMember";

export class FriendRequest {
    _id: string;
    from: UpdatableChatMember;
    to: UpdatableChatMember;
    date: number;
    profile: UpdatableChatMember;
}